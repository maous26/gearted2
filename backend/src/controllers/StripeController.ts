import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

/**
 * MODÈLE C2C - Gearted Marketplace
 *
 * Tous les paiements sont collectés sur le compte Stripe de Gearted.
 * Les vendeurs reçoivent leurs paiements via virement IBAN.
 *
 * Les routes Stripe Connect (createConnectedAccount, getAccountStatus, etc.)
 * ont été supprimées car les vendeurs n'ont pas besoin de compte Stripe.
 */
export class StripeController {
  /**
   * Créer un Payment Intent pour acheter un produit
   * POST /api/stripe/create-payment-intent
   *
   * Utilise le mode ESCROW (capture manuelle):
   * - Les fonds sont autorisés mais non capturés immédiatement
   * - La capture se fait après confirmation de livraison par l'acheteur
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        productId,
        amount,
        currency = 'eur',
        // Options premium acheteur
        wantExpertise = false,
        wantInsurance = false,
        expertisePrice = 0,
        insurancePrice = 0,
        grandTotal,
        // Livraison (payée par l'acheteur)
        shippingRateId,
        shippingCost = 0,
        shippingProvider
      } = req.body;

      if (!productId || !amount) {
        return res.status(400).json({ error: 'Product ID and amount are required' });
      }

      // Récupérer le produit et le vendeur
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { seller: true }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.sellerId === userId) {
        return res.status(400).json({ error: 'You cannot buy your own product' });
      }

      if (product.status === 'SOLD') {
        return res.status(400).json({ error: 'This product is already sold' });
      }

      // Options premium + livraison
      const premiumOptions = {
        wantExpertise,
        wantInsurance,
        expertisePrice: Number(expertisePrice) || 0,
        insurancePrice: Number(insurancePrice) || 0,
        grandTotal: grandTotal ? Number(grandTotal) : undefined,
        // Livraison
        shippingRateId: shippingRateId || null,
        shippingCost: Number(shippingCost) || 0,
        shippingProvider: shippingProvider || null
      };

      const result = await StripeService.createPaymentIntent(
        productId,
        userId,
        product.sellerId,
        amount,
        currency,
        premiumOptions
      );

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Stripe] Create payment intent error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Confirmer un paiement
   * POST /api/stripe/confirm-payment
   */
  static async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment Intent ID is required' });
      }

      const result = await StripeService.confirmPayment(paymentIntentId);

      return res.json({
        success: true,
        status: result.status,
        escrowStatus: result.escrowStatus
      });
    } catch (error: any) {
      console.error('[Stripe] Confirm payment error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Webhook Stripe pour recevoir les événements
   * POST /api/stripe/webhook
   *
   * Événements escrow gérés:
   * - payment_intent.amount_capturable_updated: Fonds autorisés
   * - payment_intent.succeeded: Fonds capturés
   * - payment_intent.canceled: Escrow annulé
   */
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      // Vérifier la signature du webhook
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      console.log(`[Stripe] Webhook received: ${event.type}`);

      // Traiter l'événement
      await StripeService.handleWebhook(event);

      return res.json({ received: true });
    } catch (error: any) {
      console.error('[Stripe] Webhook error:', error.message);
      return res.status(400).json({
        error: `Webhook Error: ${error.message}`
      });
    }
  }

  /**
   * Récupérer la clé publique Stripe
   * GET /api/stripe/public-key
   */
  static getPublicKey(req: Request, res: Response) {
    return res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  }
}

export default StripeController;
