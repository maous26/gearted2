import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';

const prisma = new PrismaClient();

export class TransactionController {
  /**
   * Récupérer toutes les ventes de l'utilisateur connecté (en tant que vendeur)
   * GET /api/transactions/my-sales
   */
  static async getMySales(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log(`[Transactions] getMySales called for userId: ${userId}`);

      // Debug: récupérer TOUTES les transactions pour voir ce qu'il y a
      const allTransactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { sellerId: true } }
        }
      });
      console.log(`[Transactions] Total transactions in DB: ${allTransactions.length}`);
      allTransactions.forEach(t => {
        console.log(`  - Transaction ${t.id}: status=${t.status}, sellerId=${t.product.sellerId}, buyerId=${t.buyerId}`);
      });

      const sales = await prisma.transaction.findMany({
        where: {
          product: {
            sellerId: userId
          },
          status: {
            in: ['PENDING', 'SUCCEEDED', 'PROCESSING']  // Include PENDING pour voir les anciennes transactions
          }
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentIntentId: true,
          trackingNumber: true,
          shippingAddress: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
              status: true,
              parcelDimensionsId: true,
              parcelDimensions: true
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`[Transactions] Found ${sales.length} sales`);
      if (sales.length > 0) {
        console.log('[Transactions] First sale structure:', JSON.stringify(sales[0], null, 2));
      }

      // Transform images from objects to URLs array and convert Decimal to number
      // CRITICAL: Prisma returns Decimal objects, must convert to number with Number()
      // Must explicitly destructure to avoid spread operator issues
      const transformedSales = sales.map(sale => {
        const { amount, product, ...rest } = sale;
        return {
          ...rest,
          amount: Number(amount),
          product: product ? {
            id: product.id,
            title: product.title,
            price: Number(product.price),
            status: product.status,
            parcelDimensionsId: product.parcelDimensionsId,
            parcelDimensions: product.parcelDimensions,
            images: Array.isArray(product.images)
              ? product.images.map((img: any) => typeof img === 'string' ? img : img.url)
              : []
          } : undefined
        };
      });

      console.log('[Transactions] Transformed sales (first):', JSON.stringify(transformedSales[0], null, 2));
      if (transformedSales.length > 0) {
        console.log('[Transactions] Type check - amount:', typeof transformedSales[0].amount, '=', transformedSales[0].amount);
        console.log('[Transactions] Type check - price:', typeof transformedSales[0].product?.price, '=', transformedSales[0].product?.price);
      }

      return res.json({
        success: true,
        sales: transformedSales
      });
    } catch (error: any) {
      console.error('[Transactions] Get my sales error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Récupérer tous les achats de l'utilisateur connecté (en tant qu'acheteur)
   * GET /api/transactions/my-purchases
   */
  static async getMyPurchases(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const purchases = await prisma.transaction.findMany({
        where: {
          buyerId: userId,
          status: {
            in: ['PENDING', 'SUCCEEDED', 'PROCESSING']  // Include PENDING pour voir les anciennes transactions
          }
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentIntentId: true,
          trackingNumber: true,
          shippingAddress: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
              status: true,
              parcelDimensionsId: true,
              parcelDimensions: true,
              seller: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`[Transactions] Found ${purchases.length} purchases`);
      if (purchases.length > 0) {
        console.log('[Transactions] First purchase structure:', JSON.stringify(purchases[0], null, 2));
      }

      // Transform images from objects to URLs array and convert Decimal to number
      // CRITICAL: Prisma returns Decimal objects, must convert to number with Number()
      // Must explicitly destructure to avoid spread operator issues
      const transformedPurchases = purchases.map(purchase => {
        const { amount, product, ...rest } = purchase;
        return {
          ...rest,
          amount: Number(amount),
          product: product ? {
            id: product.id,
            title: product.title,
            price: Number(product.price),
            status: product.status,
            parcelDimensionsId: product.parcelDimensionsId,
            parcelDimensions: product.parcelDimensions,
            images: Array.isArray(product.images)
              ? product.images.map((img: any) => typeof img === 'string' ? img : img.url)
              : [],
            seller: product.seller
          } : undefined
        };
      });

      return res.json({
        success: true,
        purchases: transformedPurchases
      });
    } catch (error: any) {
      console.error('[Transactions] Get my purchases error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Récupérer les détails d'une transaction
   * GET /api/transactions/:transactionId
   */
  static async getTransactionDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Vérifier que l'utilisateur est soit l'acheteur soit le vendeur
      if (transaction.buyerId !== userId && transaction.product.sellerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      return res.json({
        success: true,
        transaction
      });
    } catch (error: any) {
      console.error('[Transactions] Get transaction details error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Annuler une transaction (avant génération d'étiquette)
   * POST /api/transactions/:transactionId/cancel
   * 
   * - L'acheteur ou le vendeur peut annuler
   * - Seulement si pas d'étiquette générée (trackingNumber)
   * - Remboursement automatique via Stripe
   * - Le produit est remis en vente
   */
  static async cancelTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;
      const { reason } = req.body; // Raison optionnelle de l'annulation

      console.log(`[Transactions] Cancel request for transaction ${transactionId} by user ${userId}`);

      // Récupérer la transaction avec toutes les infos nécessaires
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sellerId: true,
            }
          },
          buyer: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      });

      if (!transaction) {
        console.log(`[Transactions] Transaction ${transactionId} not found`);
        return res.status(404).json({ error: 'Transaction introuvable' });
      }

      // Vérifier que l'utilisateur est soit l'acheteur soit le vendeur
      const isBuyer = transaction.buyerId === userId;
      const isSeller = transaction.product.sellerId === userId;

      if (!isBuyer && !isSeller) {
        console.log(`[Transactions] User ${userId} is not authorized to cancel transaction ${transactionId}`);
        return res.status(403).json({ error: 'Non autorisé à annuler cette transaction' });
      }

      // Vérifier que l'étiquette n'a pas été générée
      if (transaction.trackingNumber) {
        console.log(`[Transactions] Cannot cancel - shipping label already generated: ${transaction.trackingNumber}`);
        return res.status(400).json({ 
          error: 'Impossible d\'annuler - l\'étiquette d\'expédition a déjà été générée',
          message: 'Une fois l\'étiquette générée, la transaction ne peut plus être annulée.'
        });
      }

      // Vérifier que le statut permet l'annulation
      if (!['PENDING', 'PROCESSING', 'SUCCEEDED'].includes(transaction.status)) {
        console.log(`[Transactions] Cannot cancel - status is ${transaction.status}`);
        return res.status(400).json({ 
          error: `Impossible d'annuler une transaction avec le statut: ${transaction.status}`
        });
      }

      // Procéder au remboursement via Stripe
      console.log(`[Transactions] Processing refund for payment intent: ${transaction.paymentIntentId}`);
      
      try {
        await StripeService.refundPayment(
          transaction.paymentIntentId,
          reason || 'requested_by_customer'
        );
        console.log(`[Transactions] Refund successful for transaction ${transactionId}`);
      } catch (stripeError: any) {
        console.error(`[Transactions] Stripe refund failed:`, stripeError);
        
        // Si le remboursement échoue, mettre quand même à jour le statut comme CANCELLED
        // (par exemple si le paiement n'a jamais été capturé)
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { 
            status: 'CANCELLED',
            metadata: {
              ...(transaction.metadata as object || {}),
              cancelledAt: new Date().toISOString(),
              cancelledBy: userId,
              cancelReason: reason || 'user_request',
              refundError: stripeError.message
            }
          }
        });

        // Remettre le produit en vente
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { status: 'ACTIVE' }
        });

        return res.json({
          success: true,
          message: 'Transaction annulée (le remboursement sera traité manuellement)',
          refundStatus: 'manual_required',
          cancelledBy: isBuyer ? 'buyer' : 'seller'
        });
      }

      // Ajouter les métadonnées d'annulation
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          metadata: {
            ...(transaction.metadata as object || {}),
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            cancelledByRole: isBuyer ? 'buyer' : 'seller',
            cancelReason: reason || 'user_request'
          }
        }
      });

      console.log(`[Transactions] Transaction ${transactionId} cancelled successfully`);

      return res.json({
        success: true,
        message: 'Transaction annulée et remboursée avec succès',
        refundStatus: 'completed',
        cancelledBy: isBuyer ? 'buyer' : 'seller',
        productId: transaction.productId,
        productTitle: transaction.product.title
      });

    } catch (error: any) {
      console.error('[Transactions] Cancel transaction error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'annulation de la transaction'
      });
    }
  }
}
