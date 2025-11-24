import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import Stripe from 'stripe';

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
      // Récupérer la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId: paymentIntent.id },
        include: { product: true }
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

      // Marquer le produit comme VENDU
      await prisma.product.update({
        where: { id: transaction.productId },
        data: {
          status: 'SOLD'
        }
      });

      console.log(`[Webhook] ✅ Product ${transaction.productId} marked as SOLD`);
      console.log(`[Webhook] ✅ Transaction ${transaction.id} marked as SUCCEEDED`);
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
