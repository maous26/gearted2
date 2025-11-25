"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const shippoService_1 = __importDefault(require("../services/shippoService"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const getUserId = (req) => {
    return req.user?.id || 'anonymous';
};
router.post('/calculate-rates', async (req, res) => {
    try {
        const { productId, fromAddress, toAddress, parcel } = req.body;
        if (!fromAddress || !toAddress) {
            return res.status(400).json({ error: 'From and to addresses are required' });
        }
        const fromValidation = shippoService_1.default.validateShippingCountry(fromAddress.country);
        if (!fromValidation.valid) {
            return res.status(400).json({ error: `Adresse d'expédition invalide: ${fromValidation.message}` });
        }
        const toValidation = shippoService_1.default.validateShippingCountry(toAddress.country);
        if (!toValidation.valid) {
            return res.status(400).json({ error: `Adresse de livraison invalide: ${toValidation.message}` });
        }
        let parcelData = parcel;
        if (!parcelData && productId) {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                include: { category: true },
            });
            if (product) {
                parcelData = shippoService_1.default.getParcelTemplate(undefined, 'medium');
            }
        }
        if (!parcelData) {
            return res.status(400).json({ error: 'Parcel dimensions are required' });
        }
        const result = await shippoService_1.default.calculateRates(fromAddress, toAddress, parcelData, {
            filterByZone: true,
            selectBest: 'cheapest',
        });
        const savedRates = await Promise.all(result.rates.map(async (rate) => {
            const carrier = rate.provider || rate.carrier || 'Unknown';
            const serviceLevel = rate.servicelevel || rate.service_level;
            let zone = 'FR';
            const destCountry = toAddress.country?.toUpperCase();
            if (destCountry === 'BE')
                zone = 'BE';
            else if (destCountry === 'CH')
                zone = 'CH';
            else if (destCountry === 'LU')
                zone = 'LU';
            return await prisma.shippingRate.create({
                data: {
                    carrier: carrier,
                    carrierName: carrier,
                    serviceLevelName: serviceLevel?.name || 'Standard',
                    serviceLevelToken: serviceLevel?.token || 'standard',
                    amount: parseFloat(rate.amount),
                    currency: rate.currency,
                    estimatedDays: rate.estimated_days || 0,
                    durationTerms: rate.duration_terms || serviceLevel?.terms || '',
                    zone: zone,
                    attributes: JSON.stringify(rate.attributes || []),
                },
            });
        }));
        return res.json({
            shipmentId: result.shipmentId,
            rates: savedRates,
            selectedRate: result.selectedRate
                ? (() => {
                    const selectedServiceLevel = result.selectedRate.servicelevel || result.selectedRate.service_level;
                    return selectedServiceLevel
                        ? savedRates.find((r) => r.serviceLevelToken === selectedServiceLevel.token)
                        : savedRates[0];
                })()
                : savedRates[0],
        });
    }
    catch (error) {
        console.error('[Shipments] Error calculating rates:', error);
        return res.status(500).json({ error: error.message || 'Failed to calculate shipping rates' });
    }
});
router.post('/create', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { productId, buyerId, fromAddress, toAddress, parcel, rateObjectId, orderNumber, } = req.body;
        if (!productId || !buyerId || !fromAddress || !toAddress || !parcel) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const fromValidation = shippoService_1.default.validateShippingCountry(fromAddress.country);
        if (!fromValidation.valid) {
            return res.status(400).json({ error: `Adresse d'expédition invalide: ${fromValidation.message}` });
        }
        const toValidation = shippoService_1.default.validateShippingCountry(toAddress.country);
        if (!toValidation.valid) {
            return res.status(400).json({ error: `Adresse de livraison invalide: ${toValidation.message}` });
        }
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { seller: true },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const { transaction, rate } = await shippoService_1.default.createShippingLabel(fromAddress, toAddress, parcel, rateObjectId, {
            selectBest: 'cheapest',
            labelFormat: 'PDF',
        });
        const parcelDimensions = await prisma.parcelDimensions.create({
            data: {
                length: parcel.length,
                width: parcel.width,
                height: parcel.height,
                weight: parcel.weight,
                isFromCatalog: false,
            },
        });
        const generatedOrderNumber = orderNumber || `#${Date.now()}`;
        const carrier = rate.provider || rate.carrier || 'Unknown';
        const serviceLevel = rate.servicelevel || rate.service_level;
        const serviceLevelToken = serviceLevel?.token || 'standard';
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
                carrier: carrier,
                serviceLevelToken: serviceLevelToken,
                estimatedDays: rate.estimated_days || 0,
                amount: parseFloat(rate.amount),
                currency: rate.currency,
                status: 'LABEL_CREATED',
                isPaid: false,
            },
        });
        try {
            await shippoService_1.default.registerTrackingWebhook(carrier, transaction.tracking_number, JSON.stringify({ shipmentId: shipment.id, productId }));
        }
        catch (error) {
            console.error('[Shipments] Failed to register tracking webhook:', error);
        }
        return res.json({
            shipment,
            transaction,
            rate,
        });
    }
    catch (error) {
        console.error('[Shipments] Error creating shipment:', error);
        return res.status(500).json({ error: error.message || 'Failed to create shipment' });
    }
});
router.get('/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('[Shipments] Error getting shipment:', error);
        return res.status(500).json({ error: error.message || 'Failed to get shipment' });
    }
});
router.get('/:id/track', async (req, res) => {
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
        const tracking = await shippoService_1.default.trackShipment(shipment.carrier, shipment.trackingNumber);
        if (tracking.tracking_status && tracking.tracking_status.status) {
            const statusMap = {
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
    }
    catch (error) {
        console.error('[Shipments] Error tracking shipment:', error);
        return res.status(500).json({ error: error.message || 'Failed to track shipment' });
    }
});
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query;
        const where = {};
        if (role === 'buyer') {
            where.buyerId = userId;
        }
        else if (role === 'seller') {
            where.sellerId = userId;
        }
        else {
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
    }
    catch (error) {
        console.error('[Shipments] Error getting user shipments:', error);
        return res.status(500).json({ error: error.message || 'Failed to get shipments' });
    }
});
router.post('/webhook/tracking', async (req, res) => {
    try {
        const { tracking_number, carrier, tracking_status, metadata } = req.body;
        const shipment = await prisma.shipment.findFirst({
            where: {
                trackingNumber: tracking_number,
            },
        });
        if (!shipment) {
            console.warn('[Shipments] Webhook received for unknown tracking number:', tracking_number);
            return res.status(404).json({ error: 'Shipment not found' });
        }
        const statusMap = {
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
        return res.json({ success: true });
    }
    catch (error) {
        console.error('[Shipments] Error processing webhook:', error);
        return res.status(500).json({ error: error.message || 'Failed to process webhook' });
    }
});
router.post('/export-csv', async (req, res) => {
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
                itemTitle: s.productId,
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
        const csv = shippoService_1.default.generateShipmentCSV(csvData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=shipments_${Date.now()}.csv`);
        return res.send(csv);
    }
    catch (error) {
        console.error('[Shipments] Error exporting CSV:', error);
        return res.status(500).json({ error: error.message || 'Failed to export CSV' });
    }
});
router.get('/parcel-templates', async (req, res) => {
    try {
        const { weaponType, size } = req.query;
        if (weaponType) {
            const template = shippoService_1.default.getParcelTemplate(weaponType);
            return res.json({ template });
        }
        const configPath = require('path').join(__dirname, '../../shippo-config.json');
        const config = require(configPath);
        return res.json({
            replicas: config.parcelTemplates.airsoft_replicas,
            accessories: config.parcelTemplates.accessories,
        });
    }
    catch (error) {
        console.error('[Shipments] Error getting parcel templates:', error);
        return res.status(500).json({ error: error.message || 'Failed to get parcel templates' });
    }
});
exports.default = router;
//# sourceMappingURL=shipments.js.map