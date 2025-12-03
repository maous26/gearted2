import { Request, Response } from 'express';
import { MondialRelayService } from '../services/MondialRelayService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MondialRelayController {
  /**
   * Search for nearby pickup points
   * GET /api/mondialrelay/pickup-points?postalCode=75001&country=FR&weight=1000
   */
  static async searchPickupPoints(req: Request, res: Response) {
    try {
      console.log('[MondialRelay] searchPickupPoints called with query:', req.query);
      
      const { postalCode, country = 'FR', weight = '1000', radius = '20000' } = req.query;

      if (!postalCode) {
        console.log('[MondialRelay] Missing postal code');
        return res.status(400).json({
          success: false,
          error: 'Postal code is required'
        });
      }

      // Call the real Mondial Relay API
      console.log('[MondialRelay] Calling REAL API for postal code:', postalCode);

      const points = await MondialRelayService.searchPickupPoints(
        postalCode as string,
        country as string,
        parseInt(weight as string),
        parseInt(radius as string)
      );

      return res.json({
        success: true,
        pickupPoints: points,
        count: points.length
      });
    } catch (error: any) {
      console.error('[MondialRelayController] Search pickup points error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get shipping rates
   * GET /api/mondialrelay/rates?weight=1000&country=FR
   */
  static async getShippingRates(req: Request, res: Response) {
    try {
      const { weight = '1000', country = 'FR' } = req.query;

      // Call the real Mondial Relay API for rates
      console.log('[MondialRelay] Getting REAL rates for weight:', weight);

      const rates = await MondialRelayService.getShippingRates(
        parseInt(weight as string),
        country as string
      );

      return res.json({
        success: true,
        rates: {
          standard: {
            name: 'Mondial Relay - Point Relais',
            price: rates.standard,
            currency: 'EUR',
            estimatedDays: 3
          },
          express: {
            name: 'Mondial Relay - Domicile',
            price: rates.express,
            currency: 'EUR',
            estimatedDays: 2
          }
        }
      });
    } catch (error: any) {
      console.error('[MondialRelayController] Get rates error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create shipping label for a transaction
   * POST /api/mondialrelay/label/:transactionId
   * Body: { pickupPointId: string, weight: number }
   */
  static async createLabel(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;
      const { pickupPointId, weight } = req.body;

      if (!pickupPointId || !weight) {
        return res.status(400).json({
          success: false,
          error: 'Pickup point ID and weight are required'
        });
      }

      // Get transaction with product and addresses
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            include: { seller: true }
          },
          buyer: true
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Check authorization (seller or buyer can create label)
      const isSeller = transaction.product.sellerId === userId;
      const isBuyer = transaction.buyerId === userId;

      if (!isSeller && !isBuyer) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if shipping address exists
      if (!transaction.shippingAddress) {
        return res.status(400).json({
          success: false,
          error: 'Shipping address not provided'
        });
      }

      const shippingAddr = transaction.shippingAddress as any;

      // Seller address (from seller profile)
      // TODO: Add seller address to database, for now use placeholder
      const senderAddress = {
        name: transaction.product.seller.username,
        address: '123 Rue Example', // TODO: Get from seller profile
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone: '0600000000',
        email: transaction.product.seller.email
      };

      // Buyer address (from transaction)
      const recipientAddress = {
        name: shippingAddr.name || transaction.buyer.username,
        address: shippingAddr.street1,
        city: shippingAddr.city,
        postalCode: shippingAddr.zip,
        country: shippingAddr.country || 'FR',
        phone: shippingAddr.phone || '0600000000',
        email: shippingAddr.email || transaction.buyer.email
      };

      // Mock label creation - éviter l'appel SOAP pour le moment
      console.log('[MondialRelay] Creating mock label for transaction:', transaction.id);
      const mockExpeditionNumber = `MR-${Date.now()}-${pickupPointId}`;
      const label = {
        expeditionNumber: mockExpeditionNumber,
        labelUrl: `https://www.mondialrelay.fr/label-mock/${mockExpeditionNumber}.pdf`,
        trackingUrl: `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${mockExpeditionNumber}`
      };

      // Update transaction with tracking info
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          trackingNumber: label.expeditionNumber,
          metadata: {
            ...(transaction.metadata as any || {}),
            shippingLabelUrl: label.labelUrl,
            shippingProvider: 'MondialRelay',
            pickupPointId: pickupPointId
          }
        }
      });

      return res.json({
        success: true,
        label: {
          expeditionNumber: label.expeditionNumber,
          labelUrl: label.labelUrl,
          trackingUrl: label.trackingUrl
        },
        transaction: updatedTransaction
      });
    } catch (error: any) {
      console.error('[MondialRelayController] Create label error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get tracking info for an expedition
   * GET /api/mondialrelay/tracking/:expeditionNumber
   */
  static async getTracking(req: Request, res: Response) {
    try {
      const { expeditionNumber } = req.params;

      // For now, return tracking URL (Mondial Relay doesn't have a simple tracking API)
      const trackingUrl = `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${expeditionNumber}`;

      return res.json({
        success: true,
        expeditionNumber,
        trackingUrl,
        message: 'Visit tracking URL for detailed status'
      });
    } catch (error: any) {
      console.error('[MondialRelayController] Get tracking error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
