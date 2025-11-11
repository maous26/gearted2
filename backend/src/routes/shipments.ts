import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import shippoService from '../services/shippoService';

const router = Router();
const prisma = new PrismaClient();

// Helper to get user ID from request (assuming auth middleware sets req.user)
const getUserId = (req: Request): string => {
  return (req as any).user?.id || 'anonymous';
};

/**
 * POST /api/shipments/calculate-rates
 * Calculate shipping rates for a product
 */
router.post('/calculate-rates', async (req: Request, res: Response) => {
  try {
    const { productId, fromAddress, toAddress, parcel } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ error: 'From and to addresses are required' });
    }

    let parcelData = parcel;

    // If no parcel provided, try to get from product or use default
    if (!parcelData && productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });

      if (product) {
        // Try to get parcel template based on product category/type
        parcelData = shippoService.getParcelTemplate(undefined, 'medium');
      }
    }

    if (!parcelData) {
      return res.status(400).json({ error: 'Parcel dimensions are required' });
    }

    // Calculate rates
    const result = await shippoService.calculateRates(
      fromAddress,
      toAddress,
      parcelData,
      {
        filterByZone: true,
        selectBest: 'cheapest',
      }
    );

    // Save rates to database for future reference
    const savedRates = await Promise.all(
      result.rates.map(async (rate) => {
        return await prisma.shippingRate.create({
          data: {
            carrier: rate.carrier,
            carrierName: rate.carrier,
            serviceLevelName: rate.service_level.name,
            serviceLevelToken: rate.service_level.token,
            amount: parseFloat(rate.amount),
            currency: rate.currency,
            estimatedDays: rate.estimated_days,
            durationTerms: rate.duration_terms || rate.service_level.terms,
            zone: toAddress.country === 'FR' ? 'FR' : 'EU',
            attributes: JSON.stringify(rate.attributes),
          },
        });
      })
    );

    return res.json({
      shipmentId: result.shipmentId,
      rates: savedRates,
      selectedRate: result.selectedRate
        ? savedRates.find((r) => r.serviceLevelToken === result.selectedRate!.service_level.token)
        : savedRates[0],
    });
  } catch (error: any) {
    console.error('[Shipments] Error calculating rates:', error);
    return res.status(500).json({ error: error.message || 'Failed to calculate shipping rates' });
  }
});

/**
 * POST /api/shipments/create
 * Create a shipment and generate label
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const {
      productId,
      buyerId,
      fromAddress,
      toAddress,
      parcel,
      rateObjectId,
      orderNumber,
    } = req.body;

    if (!productId || !buyerId || !fromAddress || !toAddress || !parcel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create shipping label
    const { transaction, rate } = await shippoService.createShippingLabel(
      fromAddress,
      toAddress,
      parcel,
      rateObjectId,
      {
        selectBest: 'cheapest',
        labelFormat: 'PDF',
      }
    );

    // Create parcel dimensions in database
    const parcelDimensions = await prisma.parcelDimensions.create({
      data: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
        isFromCatalog: false,
      },
    });

    // Generate order number if not provided
    const generatedOrderNumber = orderNumber || `#${Date.now()}`;

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
        orderNumber: generatedOrderNumber,
        shippoObjectId: transaction.object_id,
        trackingNumber: transaction.tracking_number,
        labelUrl: transaction.label_url,
        trackingStatus: transaction.status,
        fromAddress: JSON.stringify(fromAddress),
        toAddress: JSON.stringify(toAddress),
        parcelId: parcelDimensions.id,
        carrier: rate.carrier,
        serviceLevelToken: rate.service_level.token,
        estimatedDays: rate.estimated_days,
        amount: parseFloat(rate.amount),
        currency: rate.currency,
        status: 'LABEL_CREATED',
        isPaid: false,
      },
    });

    // Register tracking webhook
    try {
      await shippoService.registerTrackingWebhook(
        rate.carrier,
        transaction.tracking_number,
        JSON.stringify({ shipmentId: shipment.id, productId })
      );
    } catch (error) {
      console.error('[Shipments] Failed to register tracking webhook:', error);
      // Non-critical error, continue
    }

    return res.json({
      shipment,
      transaction,
      rate,
    });
  } catch (error: any) {
    console.error('[Shipments] Error creating shipment:', error);
    return res.status(500).json({ error: error.message || 'Failed to create shipment' });
  }
});

/**
 * GET /api/shipments/:id
 * Get shipment details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        parcel: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    return res.json(shipment);
  } catch (error: any) {
    console.error('[Shipments] Error getting shipment:', error);
    return res.status(500).json({ error: error.message || 'Failed to get shipment' });
  }
});

/**
 * GET /api/shipments/:id/track
 * Track a shipment
 */
router.get('/:id/track', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (!shipment.carrier || !shipment.trackingNumber) {
      return res.status(400).json({ error: 'Tracking information not available' });
    }

    // Get tracking info from Shippo
    const tracking = await shippoService.trackShipment(
      shipment.carrier,
      shipment.trackingNumber
    );

    // Update shipment status
    if (tracking.tracking_status && tracking.tracking_status.status) {
      const statusMap: any = {
        UNKNOWN: 'PENDING',
        PRE_TRANSIT: 'LABEL_CREATED',
        TRANSIT: 'IN_TRANSIT',
        DELIVERED: 'DELIVERED',
        RETURNED: 'RETURNED',
        FAILURE: 'FAILED',
      };

      const newStatus = statusMap[tracking.tracking_status.status] || shipment.status;

      await prisma.shipment.update({
        where: { id },
        data: {
          trackingStatus: tracking.tracking_status.status,
          status: newStatus,
          deliveredAt: newStatus === 'DELIVERED' ? new Date() : shipment.deliveredAt,
        },
      });
    }

    return res.json({
      shipment,
      tracking,
    });
  } catch (error: any) {
    console.error('[Shipments] Error tracking shipment:', error);
    return res.status(500).json({ error: error.message || 'Failed to track shipment' });
  }
});

/**
 * GET /api/shipments/user/:userId
 * Get all shipments for a user (as buyer or seller)
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.query; // 'buyer' or 'seller'

    const where: any = {};
    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        parcel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ shipments });
  } catch (error: any) {
    console.error('[Shipments] Error getting user shipments:', error);
    return res.status(500).json({ error: error.message || 'Failed to get shipments' });
  }
});

/**
 * POST /api/shipments/webhook/tracking
 * Webhook endpoint for tracking updates from Shippo
 */
router.post('/webhook/tracking', async (req: Request, res: Response) => {
  try {
    const { tracking_number, carrier, tracking_status, metadata } = req.body;

    // Find shipment by tracking number
    const shipment = await prisma.shipment.findFirst({
      where: {
        trackingNumber: tracking_number,
      },
    });

    if (!shipment) {
      console.warn('[Shipments] Webhook received for unknown tracking number:', tracking_number);
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update shipment status
    const statusMap: any = {
      UNKNOWN: 'PENDING',
      PRE_TRANSIT: 'LABEL_CREATED',
      TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
      RETURNED: 'RETURNED',
      FAILURE: 'FAILED',
    };

    const newStatus = statusMap[tracking_status?.status] || shipment.status;

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        trackingStatus: tracking_status?.status,
        status: newStatus,
        deliveredAt: newStatus === 'DELIVERED' ? new Date() : shipment.deliveredAt,
        metadata: metadata ? JSON.stringify(metadata) : shipment.metadata,
      },
    });

    // TODO: Send notification to buyer/seller about status update

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Shipments] Error processing webhook:', error);
    return res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
});

/**
 * POST /api/shipments/export-csv
 * Export shipments to CSV for bulk Shippo import
 */
router.post('/export-csv', async (req: Request, res: Response) => {
  try {
    const { shipmentIds } = req.body;

    if (!shipmentIds || !Array.isArray(shipmentIds)) {
      return res.status(400).json({ error: 'shipmentIds array is required' });
    }

    const shipments = await prisma.shipment.findMany({
      where: {
        id: { in: shipmentIds },
      },
      include: {
        parcel: true,
      },
    });

    // Transform to CSV format
    const csvData = shipments.map((s) => {
      const toAddr = JSON.parse(s.toAddress);
      const parcel = s.parcel;

      return {
        orderNumber: s.orderNumber,
        orderDate: s.createdAt.toISOString(),
        recipientName: toAddr.name,
        company: toAddr.company || '',
        email: toAddr.email || '',
        phone: toAddr.phone || '',
        street1: toAddr.street1,
        street2: toAddr.street2 || '',
        city: toAddr.city,
        state: toAddr.state || '',
        zip: toAddr.zip,
        country: toAddr.country,
        itemTitle: s.productId, // TODO: Get actual product title
        sku: s.productId,
        quantity: 1,
        itemWeight: parcel?.weight || 0,
        itemWeightUnit: 'kg',
        itemPrice: s.amount.toString(),
        itemCurrency: s.currency,
        orderWeight: parcel?.weight || 0,
        orderWeightUnit: 'kg',
        orderAmount: s.amount.toString(),
        orderCurrency: s.currency,
      };
    });

    const csv = shippoService.generateShipmentCSV(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=shipments_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error: any) {
    console.error('[Shipments] Error exporting CSV:', error);
    return res.status(500).json({ error: error.message || 'Failed to export CSV' });
  }
});

/**
 * GET /api/shipments/parcel-templates
 * Get available parcel templates from config
 */
router.get('/parcel-templates', async (req: Request, res: Response) => {
  try {
    const { weaponType, size } = req.query;

    if (weaponType) {
      const template = shippoService.getParcelTemplate(weaponType as string);
      return res.json({ template });
    }

    // Return all templates
    const configPath = require('path').join(__dirname, '../../shippo-config.json');
    const config = require(configPath);

    return res.json({
      replicas: config.parcelTemplates.airsoft_replicas,
      accessories: config.parcelTemplates.accessories,
    });
  } catch (error: any) {
    console.error('[Shipments] Error getting parcel templates:', error);
    return res.status(500).json({ error: error.message || 'Failed to get parcel templates' });
  }
});

export default router;

