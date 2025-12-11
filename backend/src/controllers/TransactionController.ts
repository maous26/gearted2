import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { ExpertService } from '../services/ExpertService';
import { NotificationController } from './NotificationController';

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
              shippingCategory: true,
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
            shippingCategory: product.shippingCategory,
            parcelDimensionsId: product.parcelDimensionsId,
            parcelDimensions: product.parcelDimensions,
            images: Array.isArray(product.images)
              ? product.images.map((img: any) => {
                  if (typeof img === 'string') return img;
                  if (img && typeof img === 'object' && img.url) return img.url;
                  if (img && typeof img === 'object' && img.uri) return img.uri;
                  return null;
                }).filter(Boolean)
              : []
          } : undefined
        };
      });

      console.log('[Transactions] Transformed sales (first):', JSON.stringify(transformedSales[0], null, 2));
      if (transformedSales.length > 0 && transformedSales[0].product) {
        console.log('[Transactions] Images in first sale:', transformedSales[0].product.images);
      }
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
              shippingCategory: true,
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
            shippingCategory: product.shippingCategory,
            parcelDimensionsId: product.parcelDimensionsId,
            parcelDimensions: product.parcelDimensions,
            images: Array.isArray(product.images)
              ? product.images.map((img: any) => {
                  if (typeof img === 'string') return img;
                  if (img && typeof img === 'object' && img.url) return img.url;
                  if (img && typeof img === 'object' && img.uri) return img.uri;
                  return null;
                }).filter(Boolean)
              : [],
            seller: product.seller
          } : undefined
        };
      });

      console.log('[Transactions] Transformed purchases (first):', JSON.stringify(transformedPurchases[0], null, 2));
      if (transformedPurchases.length > 0 && transformedPurchases[0].product) {
        console.log('[Transactions] Images in first purchase:', transformedPurchases[0].product.images);
      }

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
   * Récupérer une transaction par son paymentIntentId
   * GET /api/transactions/by-payment-intent/:paymentIntentId
   * Utilisé pour le polling après un paiement réussi
   */
  static async getByPaymentIntent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID required' });
      }

      console.log(`[Transactions] Looking up transaction by paymentIntentId: ${paymentIntentId}`);

      const transaction = await prisma.transaction.findFirst({
        where: { paymentIntentId },
        select: {
          id: true,
          status: true,
          paymentIntentId: true,
          productId: true,
          buyerId: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              title: true,
              status: true,
              sellerId: true,
            }
          }
        }
      });

      if (!transaction) {
        console.log(`[Transactions] No transaction found for paymentIntentId: ${paymentIntentId}`);
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Vérifier que l'utilisateur est soit l'acheteur soit le vendeur
      if (transaction.buyerId !== userId && transaction.product.sellerId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      console.log(`[Transactions] Found transaction ${transaction.id} with status: ${transaction.status}`);

      return res.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          paymentIntentId: transaction.paymentIntentId,
          productId: transaction.productId,
          amount: Number(transaction.amount),
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        }
      });
    } catch (error: any) {
      console.error('[Transactions] Get by payment intent error:', error);
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

      console.log(`[Transactions] Cancel request for transaction "${transactionId}" (length: ${transactionId?.length}) by user ${userId}`);
      console.log(`[Transactions] Raw params:`, JSON.stringify(req.params));

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
        console.log(`[Transactions] Transaction "${transactionId}" not found in database`);
        // Debug: list all transaction IDs
        const allTxIds = await prisma.transaction.findMany({ select: { id: true }, take: 10 });
        console.log(`[Transactions] Available transactions:`, allTxIds.map(t => t.id));
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

        // 🔔 NOTIFICATIONS D'ANNULATION (même si le remboursement a échoué)
        try {
          const cancellerRole = isBuyer ? 'BUYER' : 'SELLER';
          const otherPartyRole = isBuyer ? 'SELLER' : 'BUYER';
          const otherPartyId = isBuyer ? transaction.product.sellerId : transaction.buyerId;
          const otherPartyUsername = isBuyer ? 'le vendeur' : transaction.buyer.username;
          const cancellerUsername = isBuyer ? transaction.buyer.username : 'le vendeur';

          // Notification pour celui qui annule (confirmation avec note sur remboursement manuel)
          await NotificationController.createNotification({
            userId: userId,
            title: '✅ Transaction annulée',
            message: `Votre ${isBuyer ? 'achat' : 'vente'} de "${transaction.product.title}" a été annulé${isBuyer ? '' : 'e'}. Le remboursement sera traité manuellement par notre équipe. Vous serez notifié dès que le remboursement sera effectué.`,
            type: 'PAYMENT_UPDATE',
            data: {
              transactionId: transaction.id,
              productId: transaction.productId,
              productTitle: transaction.product.title,
              role: cancellerRole,
              action: 'cancelled',
              refundStatus: 'manual_required'
            }
          });

          // Notification pour l'autre partie (alerte d'annulation)
          await NotificationController.createNotification({
            userId: otherPartyId,
            title: '❌ Transaction annulée',
            message: `${cancellerUsername} a annulé ${isBuyer ? 'son achat' : 'la vente'} de "${transaction.product.title}". Le remboursement sera traité manuellement.${isBuyer ? ' Votre produit a été remis en vente.' : ''}`,
            type: 'PAYMENT_UPDATE',
            data: {
              transactionId: transaction.id,
              productId: transaction.productId,
              productTitle: transaction.product.title,
              role: otherPartyRole,
              action: 'cancelled_by_other',
              cancelledBy: cancellerRole,
              refundStatus: 'manual_required'
            }
          });

          console.log(`[Transactions] Cancellation notifications sent (manual refund case)`);
        } catch (notifError) {
          console.error(`[Transactions] Failed to send cancellation notifications:`, notifError);
        }

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

      // 🔔 NOTIFICATIONS D'ANNULATION
      try {
        const cancellerRole = isBuyer ? 'BUYER' : 'SELLER';
        const otherPartyRole = isBuyer ? 'SELLER' : 'BUYER';
        const otherPartyId = isBuyer ? transaction.product.sellerId : transaction.buyerId;
        const otherPartyUsername = isBuyer ? 'le vendeur' : transaction.buyer.username;
        const cancellerUsername = isBuyer ? transaction.buyer.username : 'le vendeur';

        // Notification pour celui qui annule (confirmation)
        await NotificationController.createNotification({
          userId: userId,
          title: '✅ Transaction annulée',
          message: `Votre ${isBuyer ? 'achat' : 'vente'} de "${transaction.product.title}" a été annulé${isBuyer ? '' : 'e'} avec succès. Le remboursement a été traité et les fonds seront recrédités sous 5-10 jours ouvrés.`,
          type: 'PAYMENT_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            productTitle: transaction.product.title,
            role: cancellerRole,
            action: 'cancelled'
          }
        });

        // Notification pour l'autre partie (alerte d'annulation)
        await NotificationController.createNotification({
          userId: otherPartyId,
          title: '❌ Transaction annulée',
          message: `${cancellerUsername} a annulé ${isBuyer ? 'son achat' : 'la vente'} de "${transaction.product.title}". Le remboursement a été effectué automatiquement.${isBuyer ? ' Votre produit a été remis en vente.' : ''}`,
          type: 'PAYMENT_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            productTitle: transaction.product.title,
            role: otherPartyRole,
            action: 'cancelled_by_other',
            cancelledBy: cancellerRole
          }
        });

        console.log(`[Transactions] Cancellation notifications sent to both parties`);
      } catch (notifError) {
        console.error(`[Transactions] Failed to send cancellation notifications:`, notifError);
        // Continue anyway - cancellation was successful
      }

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

  /**
   * ESCROW - VENTE SIMPLE: L'acheteur confirme la réception du colis
   * POST /api/transactions/:transactionId/confirm-delivery
   *
   * Cette action:
   * 1. Vérifie que c'est une vente SIMPLE (pas Expert)
   * 2. Capture les fonds en escrow
   * 3. Transfère le paiement au vendeur
   */
  static async confirmDelivery(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;

      console.log(`[Transactions] Confirm delivery for transaction ${transactionId} by user ${userId}`);

      // Récupérer la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sellerId: true,
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction non trouvée' });
      }

      // Vérifier que c'est bien l'acheteur
      if (transaction.buyerId !== userId) {
        return res.status(403).json({ error: 'Seul l\'acheteur peut confirmer la réception' });
      }

      // Vérifier que ce n'est PAS une vente Expert
      if (transaction.hasExpert) {
        return res.status(400).json({
          error: 'Cette transaction utilise Expert Gearted. Utilisez /api/expert/confirm-delivery/:expertServiceId à la place.'
        });
      }

      // Vérifier le statut - Avec Stripe Connect Standard, le paiement est déjà effectué
      if (transaction.status === 'SUCCEEDED') {
        // Transaction déjà finalisée, on confirme juste la réception
        return res.json({
          success: true,
          message: 'Réception confirmée ! Le vendeur a déjà été payé.'
        });
      }

      // Mettre à jour le statut de la transaction si nécessaire
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'SUCCEEDED',
          metadata: {
            ...(transaction.metadata as any || {}),
            deliveryConfirmedAt: new Date().toISOString(),
            deliveryConfirmedBy: userId
          }
        }
      });

      console.log(`[Transactions] Delivery confirmed for transaction ${transactionId}`);

      return res.json({
        success: true,
        message: 'Réception confirmée ! Le vendeur a déjà été payé via Stripe Connect.'
      });

    } catch (error: any) {
      console.error('[Transactions] Confirm delivery error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la confirmation de livraison'
      });
    }
  }

  /**
   * ESCROW - VENTE EXPERT: L'acheteur confirme la réception du colis Expert
   * POST /api/transactions/:transactionId/confirm-expert-delivery
   *
   * Cette action est appelée quand l'acheteur reçoit son colis après vérification Expert.
   * Elle déclenche la capture escrow et le paiement au vendeur.
   */
  static async confirmExpertDelivery(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId } = req.params;

      console.log(`[Transactions] Confirm Expert delivery for transaction ${transactionId} by user ${userId}`);

      // Récupérer la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sellerId: true,
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction non trouvée' });
      }

      // Vérifier que c'est bien l'acheteur
      if (transaction.buyerId !== userId) {
        return res.status(403).json({ error: 'Seul l\'acheteur peut confirmer la réception' });
      }

      // Vérifier que c'est bien une vente Expert
      if (!transaction.hasExpert) {
        return res.status(400).json({
          error: 'Cette transaction n\'utilise pas Expert Gearted. Utilisez /api/transactions/:id/confirm-delivery à la place.'
        });
      }

      // Récupérer le service Expert
      const expertService = await (prisma as any).expertService.findUnique({
        where: { transactionId }
      });

      if (!expertService) {
        return res.status(404).json({ error: 'Service Expert non trouvé pour cette transaction' });
      }

      // Utiliser ExpertService pour confirmer
      const result = await ExpertService.confirmDeliveryByBuyer(expertService.id, userId);

      console.log(`[Transactions] Expert delivery confirmed and funds transferred for transaction ${transactionId}`);

      return res.json({
        ...result,
        message: 'Réception confirmée ! Le vendeur a été payé. Merci d\'avoir utilisé Expert Gearted.'
      });

    } catch (error: any) {
      console.error('[Transactions] Confirm Expert delivery error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la confirmation de livraison Expert'
      });
    }
  }

  /**
   * Récupérer le statut escrow d'une transaction
   * GET /api/transactions/:transactionId/escrow-status
   */
  static async getEscrowStatus(req: Request, res: Response) {
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
            select: { sellerId: true, title: true }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction non trouvée' });
      }

      // Vérifier que l'utilisateur est impliqué dans la transaction
      if (transaction.buyerId !== userId && transaction.product.sellerId !== userId) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      const metadata = transaction.metadata as any;
      const isBuyer = transaction.buyerId === userId;

      // Déterminer l'action requise
      let actionRequired = null;
      if (metadata?.escrowStatus === 'AUTHORIZED' && transaction.status === 'PROCESSING') {
        if (transaction.hasExpert) {
          // Pour Expert, l'action dépend du statut du service Expert
          const expertService = await (prisma as any).expertService.findUnique({
            where: { transactionId }
          });
          if (expertService?.status === 'DELIVERED' && isBuyer) {
            actionRequired = 'confirm_expert_delivery';
          }
        } else if (isBuyer) {
          actionRequired = 'confirm_delivery';
        }
      }

      return res.json({
        success: true,
        escrow: {
          status: metadata?.escrowStatus || 'UNKNOWN',
          transactionStatus: transaction.status,
          hasExpert: transaction.hasExpert,
          authorizedAt: metadata?.authorizedAt,
          capturedAt: metadata?.capturedAt,
          amountCapturable: metadata?.amountCapturable,
          stripeFeeAbsorbed: metadata?.stripeFeeAbsorbed,
          netPlatformFee: metadata?.netPlatformFee,
          actionRequired,
        },
        productTitle: transaction.product.title,
        amount: Number(transaction.amount),
        totalPaid: Number(transaction.totalPaid),
        sellerAmount: Number(transaction.sellerAmount),
      });

    } catch (error: any) {
      console.error('[Transactions] Get escrow status error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
