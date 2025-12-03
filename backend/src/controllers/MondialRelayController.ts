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

      // Temporairement utiliser des données mock pour éviter l'erreur SOAP
      // TODO: Réactiver MondialRelayService quand les credentials seront configurés
      console.log('[MondialRelay] Using mock data for postal code:', postalCode);
      
      const mockPoints = [
        {
          id: '24R00001',
          name: 'Relay Point Paris Centre',
          address: `12 Rue de Rivoli`,
          city: 'Paris',
          postalCode: postalCode as string,
          country: country as string,
          latitude: '48.8566',
          longitude: '2.3522',
          distance: '500',
          openingHours: {
            monday: '0900 1200 1400 1900',
            tuesday: '0900 1200 1400 1900',
            wednesday: '0900 1200 1400 1900',
            thursday: '0900 1200 1400 1900',
            friday: '0900 1200 1400 1900',
            saturday: '0900 1300 0000 0000',
            sunday: '0000 0000 0000 0000'
          }
        },
        {
          id: '24R00002',
          name: 'Tabac Presse du Marché',
          address: `25 Avenue de la République`,
          city: 'Paris',
          postalCode: postalCode as string,
          country: country as string,
          latitude: '48.8656',
          longitude: '2.3622',
          distance: '1200',
          openingHours: {
            monday: '0800 1300 1500 2000',
            tuesday: '0800 1300 1500 2000',
            wednesday: '0800 1300 1500 2000',
            thursday: '0800 1300 1500 2000',
            friday: '0800 1300 1500 2000',
            saturday: '0800 1400 0000 0000',
            sunday: '0000 0000 0000 0000'
          }
        },
        {
          id: '24R00003',
          name: 'Épicerie du Coin',
          address: `8 Boulevard Saint-Michel`,
          city: 'Paris',
          postalCode: postalCode as string,
          country: country as string,
          latitude: '48.8534',
          longitude: '2.3434',
          distance: '800',
          openingHours: {
            monday: '0730 2100 0000 0000',
            tuesday: '0730 2100 0000 0000',
            wednesday: '0730 2100 0000 0000',
            thursday: '0730 2100 0000 0000',
            friday: '0730 2100 0000 0000',
            saturday: '0800 2000 0000 0000',
            sunday: '0900 1300 0000 0000'
          }
        }
      ];

      return res.json({
        success: true,
        pickupPoints: mockPoints,
        count: mockPoints.length
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

      // Mock rates - éviter l'appel SOAP pour le moment
      console.log('[MondialRelay] Using mock rates for weight:', weight);
      const rates = {
        standard: 5.90,
        express: 8.90
      };

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
