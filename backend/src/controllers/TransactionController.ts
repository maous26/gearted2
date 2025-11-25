import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
              price: true
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
      const transformedSales = sales.map(sale => ({
        ...sale,
        amount: typeof sale.amount === 'string' ? parseFloat(sale.amount) : sale.amount,
        product: sale.product ? {
          ...sale.product,
          price: typeof sale.product.price === 'string' ? parseFloat(sale.product.price) : sale.product.price,
          images: Array.isArray(sale.product.images)
            ? sale.product.images.map((img: any) => typeof img === 'string' ? img : img.url)
            : []
        } : undefined
      }));

      console.log('[Transactions] Transformed sales (first):', JSON.stringify(transformedSales[0], null, 2));

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
      const transformedPurchases = purchases.map(purchase => ({
        ...purchase,
        amount: typeof purchase.amount === 'string' ? parseFloat(purchase.amount) : purchase.amount,
        product: purchase.product ? {
          ...purchase.product,
          price: typeof purchase.product.price === 'string' ? parseFloat(purchase.product.price) : purchase.product.price,
          images: Array.isArray(purchase.product.images)
            ? purchase.product.images.map((img: any) => typeof img === 'string' ? img : img.url)
            : []
        } : undefined
      }));

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
}
