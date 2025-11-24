import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { ShippoService } from '../services/ShippoService';

const prisma = new PrismaClient();

export class ShippingController {
  /**
   * Ajouter une adresse de livraison à une transaction
   * POST /api/shipping/address/:transactionId
   */
  static async addShippingAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;
      const { name, street1, street2, city, state, zip, country, phone, email } = req.body;

      // Chercher la transaction soit par ID soit par paymentIntentId
      let transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { buyer: true, product: true }
      });

      // Si pas trouvé par ID, essayer par paymentIntentId
      if (!transaction) {
        transaction = await prisma.transaction.findUnique({
          where: { paymentIntentId: transactionId },
          include: { buyer: true, product: true }
        });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.buyerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Mettre à jour l'adresse de livraison
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          shippingAddress: {
            name,
            street1,
            street2,
            city,
            state,
            zip,
            country,
            phone,
            email
          }
        }
      });

      return res.json({
        success: true,
        transaction: updatedTransaction
      });
    } catch (error: any) {
      console.error('[Shipping] Add address error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtenir les tarifs de livraison
   * POST /api/shipping/rates/:transactionId
   */
  static async getShippingRates(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;
      const { length, width, height, weight } = req.body;

      // Récupérer la transaction avec adresse et info vendeur
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            include: { seller: true }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.product.sellerId !== userId) {
        return res.status(403).json({ error: 'Only the seller can get shipping rates' });
      }

      if (!transaction.shippingAddress) {
        return res.status(400).json({ error: 'Shipping address not provided yet' });
      }

      // Adresse du vendeur (à configurer - pour l'instant hardcodé)
      const fromAddress = {
        name: transaction.product.seller.username,
        street1: '123 Rue Example', // TODO: Ajouter adresse vendeur en DB
        city: 'Paris',
        state: 'IDF',
        zip: '75001',
        country: 'FR',
        email: transaction.product.seller.email
      };

      // Adresse de l'acheteur
      const toAddress = transaction.shippingAddress as any;

      // Dimensions du colis
      const parcel = {
        length: length.toString(),
        width: width.toString(),
        height: height.toString(),
        distance_unit: 'cm' as const,
        weight: weight.toString(),
        mass_unit: 'kg' as const
      };

      // Obtenir les tarifs via Shippo
      const rates = await ShippoService.getShippingRates(fromAddress, toAddress, parcel);

      return res.json({
        success: true,
        ...rates
      });
    } catch (error: any) {
      console.error('[Shipping] Get rates error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Acheter une étiquette de livraison
   * POST /api/shipping/label/:transactionId
   */
  static async purchaseLabel(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;
      const { rateId } = req.body;

      // Vérifier que l'utilisateur est le vendeur
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { product: true }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.product.sellerId !== userId) {
        return res.status(403).json({ error: 'Only the seller can purchase shipping label' });
      }

      // Acheter l'étiquette via Shippo
      const label = await ShippoService.buyShippingLabel(rateId);

      // Mettre à jour la transaction avec le numéro de suivi
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          trackingNumber: label.trackingNumber,
          metadata: {
            ...((transaction.metadata as any) || {}),
            labelUrl: label.labelUrl,
            trackingUrl: label.trackingUrl,
            estimatedDelivery: label.estimatedDelivery
          }
        }
      });

      return res.json({
        success: true,
        label,
        transaction: updatedTransaction
      });
    } catch (error: any) {
      console.error('[Shipping] Purchase label error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtenir les informations de suivi
   * GET /api/shipping/tracking/:transactionId
   */
  static async getTracking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;

      // Récupérer la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: true,
          buyer: true
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Vérifier que l'utilisateur est l'acheteur ou le vendeur
      if (transaction.buyerId !== userId && transaction.product.sellerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!transaction.trackingNumber) {
        return res.status(404).json({ error: 'No tracking number available yet' });
      }

      // Pour obtenir le tracking, on a besoin du carrier
      // On le stocke dans metadata lors de l'achat de l'étiquette
      const metadata = transaction.metadata as any;
      const carrier = metadata?.carrier || 'unknown';

      // Obtenir les infos de suivi via Shippo
      const tracking = await ShippoService.getTracking(carrier, transaction.trackingNumber);

      return res.json({
        success: true,
        tracking,
        trackingNumber: transaction.trackingNumber,
        trackingUrl: metadata?.trackingUrl
      });
    } catch (error: any) {
      console.error('[Shipping] Get tracking error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtenir toutes les transactions nécessitant un envoi (vendeur)
   * GET /api/shipping/pending
   */
  static async getPendingShipments(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Récupérer toutes les transactions où l'utilisateur est vendeur
      // et qui ont une adresse de livraison mais pas encore de tracking
      const pendingShipments = await prisma.transaction.findMany({
        where: {
          product: {
            sellerId: userId
          },
          status: 'SUCCEEDED',
          shippingAddress: {
            not: Prisma.DbNull
          },
          trackingNumber: null
        },
        include: {
          product: true,
          buyer: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.json({
        success: true,
        shipments: pendingShipments
      });
    } catch (error: any) {
      console.error('[Shipping] Get pending shipments error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Supprimer les données d'adresse d'une transaction (RGPD - Droit à l'oubli)
   * DELETE /api/shipping/address/:transactionId
   */
  static async deleteShippingAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;

      // Vérifier que la transaction appartient à l'utilisateur (acheteur)
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { product: true }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.buyerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Supprimer l'adresse de livraison
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          shippingAddress: Prisma.DbNull
        }
      });

      return res.json({
        success: true,
        message: 'Shipping address deleted successfully'
      });
    } catch (error: any) {
      console.error('[Shipping] Delete address error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtenir toutes les adresses de livraison de l'utilisateur (RGPD - Droit d'accès)
   * GET /api/shipping/my-addresses
   */
  static async getMyShippingAddresses(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Récupérer toutes les transactions avec adresse de livraison
      const transactions = await prisma.transaction.findMany({
        where: {
          buyerId: userId,
          shippingAddress: {
            not: Prisma.DbNull
          }
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.json({
        success: true,
        addresses: transactions.map((t: any) => ({
          transactionId: t.id,
          address: t.shippingAddress,
          productTitle: t.product.title,
          productImage: (t.product.images as any)?.[0],
          createdAt: t.createdAt,
          trackingNumber: t.trackingNumber
        }))
      });
    } catch (error: any) {
      console.error('[Shipping] Get my addresses error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
