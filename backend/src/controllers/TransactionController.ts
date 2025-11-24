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
        include: {
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

      return res.json({
        success: true,
        sales
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
        include: {
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

      return res.json({
        success: true,
        purchases
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
