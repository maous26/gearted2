import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { NotificationController } from './NotificationController';
import { BoostService } from '../services/BoostService';
import { ProtectionService } from '../services/ProtectionService';
import { ExpertService } from '../services/ExpertService';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export class WebhookController {
  /**
   * Webhook Stripe pour gérer les événements de paiement
   * POST /webhook
   */
  static async handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error('[Webhook] Missing signature or webhook secret');
      return res.status(400).send('Webhook signature or secret missing');
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook pour la sécurité
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    try {
      // Gérer les différents types d'événements
      switch (event.type) {
        case 'payment_intent.succeeded':
          await WebhookController.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await WebhookController.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await WebhookController.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await WebhookController.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      // Répondre rapidement à Stripe
      return res.json({ received: true });
    } catch (error: any) {
      console.error('[Webhook] Error processing event:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Gérer le succès d'un paiement
   */
  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);

    try {
      // 🚀 GÉRER LES SERVICES PREMIUM (Boost, Protect, Expert)
      const paymentType = paymentIntent.metadata?.type;

      if (paymentType === 'boost') {
        console.log(`[Webhook] 🚀 Activating Boost for PaymentIntent: ${paymentIntent.id}`);
        try {
          await BoostService.activateBoost(paymentIntent.id);
          console.log(`[Webhook] ✅ Boost activated successfully`);
        } catch (error) {
          console.error(`[Webhook] ❌ Failed to activate boost:`, error);
        }
        return; // Boost n'a pas de transaction standard
      }

      if (paymentType === 'protection') {
        console.log(`[Webhook] 🛡️ Activating Protection for PaymentIntent: ${paymentIntent.id}`);
        try {
          await ProtectionService.activateProtection(paymentIntent.id);
          console.log(`[Webhook] ✅ Protection activated successfully`);
        } catch (error) {
          console.error(`[Webhook] ❌ Failed to activate protection:`, error);
        }
        // Continue pour traiter la transaction normale
      }

      if (paymentType === 'expert') {
        console.log(`[Webhook] 🔬 Activating Expert Service for PaymentIntent: ${paymentIntent.id}`);
        try {
          await ExpertService.activateExpertService(paymentIntent.id);
          console.log(`[Webhook] ✅ Expert service activated successfully`);
        } catch (error) {
          console.error(`[Webhook] ❌ Failed to activate expert service:`, error);
        }
        // Continue pour traiter la transaction normale
      }

      // Récupérer la transaction avec toutes les relations
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: paymentIntent.id },
        include: {
          product: {
            include: {
              seller: true
            }
          },
          buyer: true
        }
      });

      if (!transaction) {
        console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
        return;
      }

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCEEDED',
        }
      });

      // Marquer le produit avec paymentCompleted (ne pas marquer SOLD tout de suite)
      const soldAt = new Date();
      const deletionScheduledAt = new Date(soldAt.getTime() + (3 * 24 * 60 * 60 * 1000)); // +3 jours

      await prisma.product.update({
        where: { id: transaction.productId },
        data: {
          paymentCompleted: true,
          paymentCompletedAt: soldAt,
          deletionScheduledAt: deletionScheduledAt,
          // Ne marquer SOLD que si dimensions déjà renseignées
          ...(transaction.product.parcelDimensionsId ? {
            status: 'SOLD',
            soldAt: soldAt
          } : {})
        }
      });

      console.log(`[Webhook] ✅ Payment completed for product ${transaction.productId}`);
      console.log(`[Webhook] ✅ Product will be deleted on ${deletionScheduledAt.toISOString()}`);
      console.log(`[Webhook] ✅ Transaction ${transaction.id} marked as SUCCEEDED`);

      // 🔔 NOTIFICATION ACHETEUR : Paiement confirmé
      try {
        await NotificationController.createNotification({
          userId: transaction.buyerId,
          title: '✅ Achat confirmé !',
          message: `Votre achat de "${transaction.product.title}" auprès de ${transaction.product.seller.username} a été confirmé !\n\nLe vendeur va maintenant préparer votre colis et renseigner ses dimensions. Vous serez notifié dès que vous pourrez générer l'étiquette d'expédition.`,
          type: 'PAYMENT_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            productTitle: transaction.product.title,
            amount: transaction.amount.toString(),
            role: 'BUYER',
            step: 'PURCHASE_COMPLETED',
            sellerName: transaction.product.seller.username
          }
        });
        console.log(`[Webhook] 🔔 Notification sent to buyer ${transaction.buyerId}`);
      } catch (notifError) {
        console.error(`[Webhook] Failed to send buyer notification:`, notifError);
      }

      // 🔔 NOTIFICATION VENDEUR : Produit vendu, renseigner dimensions
      try {
        await NotificationController.createNotification({
          userId: transaction.product.sellerId,
          title: '🎉 Nouvelle vente !',
          message: `Félicitations ! ${transaction.buyer.username} vient d'acheter "${transaction.product.title}" pour ${(Number(transaction.amount) / 100).toFixed(2)}€ !\n\n👉 Action requise : Rendez-vous dans "Mes ventes" pour renseigner les dimensions du colis et permettre à l'acheteur de générer l'étiquette d'expédition.`,
          type: 'PAYMENT_UPDATE',
          data: {
            transactionId: transaction.id,
            productId: transaction.productId,
            productTitle: transaction.product.title,
            amount: transaction.amount.toString(),
            role: 'SELLER',
            step: 'SALE_COMPLETED',
            buyerName: transaction.buyer.username
          }
        });
        console.log(`[Webhook] 🔔 Notification sent to seller ${transaction.product.sellerId}`);
      } catch (notifError) {
        console.error(`[Webhook] Failed to send seller notification:`, notifError);
      }
    } catch (error) {
      console.error('[Webhook] Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Gérer l'échec d'un paiement
   */
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (!transaction) {
        console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
        return;
      }

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...((transaction.metadata as any) || {}),
            failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
          }
        }
      });

      console.log(`[Webhook] ❌ Transaction ${transaction.id} marked as FAILED`);
    } catch (error) {
      console.error('[Webhook] Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Gérer l'annulation d'un paiement
   */
  private static async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    console.log(`[Webhook] Payment canceled: ${paymentIntent.id}`);

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (!transaction) {
        console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
        return;
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CANCELLED'
        }
      });

      console.log(`[Webhook] ⚠️ Transaction ${transaction.id} marked as CANCELLED`);
    } catch (error) {
      console.error('[Webhook] Error handling payment cancellation:', error);
      throw error;
    }
  }

  /**
   * Gérer un remboursement
   */
  private static async handleRefund(charge: Stripe.Charge) {
    console.log(`[Webhook] Refund processed for charge: ${charge.id}`);

    try {
      // Trouver la transaction via le PaymentIntent
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: charge.payment_intent as string },
        include: { product: true }
      });

      if (!transaction) {
        console.error(`[Webhook] Transaction not found for charge: ${charge.id}`);
        return;
      }

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...((transaction.metadata as any) || {}),
            refundedAt: new Date().toISOString(),
            refundAmount: charge.amount_refunded
          }
        }
      });

      // Remettre le produit en vente (ACTIVE)
      await prisma.product.update({
        where: { id: transaction.productId },
        data: {
          status: 'ACTIVE'
        }
      });

      console.log(`[Webhook] 💰 Transaction ${transaction.id} marked as REFUNDED`);
      console.log(`[Webhook] 🔄 Product ${transaction.productId} marked as ACTIVE again`);
    } catch (error) {
      console.error('[Webhook] Error handling refund:', error);
      throw error;
    }
  }
}
