import { Request, Response } from 'express';
import { MondialRelayService } from '../services/MondialRelayService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock pickup points for fallback when API fails
const getMockPickupPoints = (postalCode: string) => {
  const basePoints = [
    {
      id: 'MR001',
      name: 'Tabac Presse du Centre',
      address: '12 Rue du Commerce',
      city: 'Paris',
      postalCode: postalCode,
      country: 'FR',
      latitude: '48.8566',
      longitude: '2.3522',
      distance: '250',
      openingHours: {
        monday: '09:00-19:00',
        tuesday: '09:00-19:00',
        wednesday: '09:00-19:00',
        thursday: '09:00-19:00',
        friday: '09:00-19:00',
        saturday: '09:00-18:00',
        sunday: 'Fermé'
      }
    },
    {
      id: 'MR002',
      name: 'Carrefour City',
      address: '45 Avenue de la République',
      city: 'Paris',
      postalCode: postalCode,
      country: 'FR',
      latitude: '48.8580',
      longitude: '2.3550',
      distance: '480',
      openingHours: {
        monday: '08:00-21:00',
        tuesday: '08:00-21:00',
        wednesday: '08:00-21:00',
        thursday: '08:00-21:00',
        friday: '08:00-21:00',
        saturday: '08:00-21:00',
        sunday: '09:00-13:00'
      }
    },
    {
      id: 'MR003',
      name: 'Pressing Express',
      address: '78 Boulevard Voltaire',
      city: 'Paris',
      postalCode: postalCode,
      country: 'FR',
      latitude: '48.8600',
      longitude: '2.3600',
      distance: '720',
      openingHours: {
        monday: '07:30-19:30',
        tuesday: '07:30-19:30',
        wednesday: '07:30-19:30',
        thursday: '07:30-19:30',
        friday: '07:30-19:30',
        saturday: '08:00-18:00',
        sunday: 'Fermé'
      }
    },
    {
      id: 'MR004',
      name: 'Librairie Papeterie Martin',
      address: '23 Rue des Écoles',
      city: 'Paris',
      postalCode: postalCode,
      country: 'FR',
      latitude: '48.8520',
      longitude: '2.3480',
      distance: '950',
      openingHours: {
        monday: '09:30-19:00',
        tuesday: '09:30-19:00',
        wednesday: '09:30-19:00',
        thursday: '09:30-19:00',
        friday: '09:30-19:00',
        saturday: '10:00-18:00',
        sunday: 'Fermé'
      }
    },
    {
      id: 'MR005',
      name: 'Boulangerie Le Pain Doré',
      address: '5 Place de la Bastille',
      city: 'Paris',
      postalCode: postalCode,
      country: 'FR',
      latitude: '48.8530',
      longitude: '2.3690',
      distance: '1200',
      openingHours: {
        monday: '06:30-20:00',
        tuesday: '06:30-20:00',
        wednesday: '06:30-20:00',
        thursday: '06:30-20:00',
        friday: '06:30-20:00',
        saturday: '07:00-20:00',
        sunday: '07:00-13:00'
      }
    }
  ];
  return basePoints;
};

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

      // Try real Mondial Relay API first
      try {
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
      } catch (apiError: any) {
        // If API fails, return mock data for development/testing
        console.warn('[MondialRelay] API failed, returning mock data:', apiError.message);
        
        const mockPoints = getMockPickupPoints(postalCode as string);
        return res.json({
          success: true,
          pickupPoints: mockPoints,
          count: mockPoints.length,
          _mock: true // Flag to indicate this is mock data
        });
      }
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

      // Try real Mondial Relay API for rates
      try {
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
      } catch (apiError: any) {
        // If API fails, return mock rates for development/testing
        console.warn('[MondialRelay] Rates API failed, returning mock rates:', apiError.message);
        
        const weightNum = parseInt(weight as string);
        const mockStandard = weightNum <= 500 ? 3.99 : weightNum <= 1000 ? 4.99 : weightNum <= 3000 ? 6.99 : 9.99;
        const mockExpress = mockStandard + 3.00;
        
        return res.json({
          success: true,
          rates: {
            standard: {
              name: 'Mondial Relay - Point Relais',
              price: mockStandard,
              currency: 'EUR',
              estimatedDays: 3
            },
            express: {
              name: 'Mondial Relay - Domicile',
              price: mockExpress,
              currency: 'EUR',
              estimatedDays: 2
            }
          },
          _mock: true
        });
      }
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
