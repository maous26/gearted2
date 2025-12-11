import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

const prisma = new PrismaClient();

/**
 * STRIPE CONNECT STANDARD - Gearted Marketplace
 *
 * Mode: Paiements directs entre acheteurs et vendeurs
 * Commission: 10% automatiquement prélevé par Gearted
 *
 * Les vendeurs doivent créer un compte Stripe Connect pour recevoir des paiements.
 */
export class StripeController {

  // ==========================================
  // STRIPE CONNECT - Onboarding vendeur
  // ==========================================

  /**
   * Créer un compte Stripe Connect Standard pour le vendeur
   * POST /api/stripe/connect/create-account
   */
  static async createConnectedAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const result = await StripeService.createConnectedAccount(userId, user.email);

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Stripe Connect] Create account error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Créer un lien d'onboarding Stripe
   * POST /api/stripe/connect/onboarding-link
   */
  static async createOnboardingLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { returnUrl, refreshUrl } = req.body;

      if (!returnUrl || !refreshUrl) {
        return res.status(400).json({ error: 'returnUrl and refreshUrl are required' });
      }

      const result = await StripeService.createOnboardingLink(userId, returnUrl, refreshUrl);

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Stripe Connect] Onboarding link error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Créer un lien vers le dashboard Stripe du vendeur
   * GET /api/stripe/connect/dashboard-link
   */
  static async createDashboardLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await StripeService.createDashboardLink(userId);

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Stripe Connect] Dashboard link error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Récupérer le statut du compte Stripe Connect
   * GET /api/stripe/connect/status
   */
  static async getAccountStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await StripeService.getAccountStatus(userId);

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Stripe Connect] Account status error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ==========================================
  // PAIEMENTS
  // ==========================================

  /**
   * Créer un Payment Intent pour acheter un produit
   * POST /api/stripe/create-payment-intent
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
        // Livraison
        shippingRateId,
        shippingCost = 0,
        shippingProvider
      } = req.body;

      if (!productId || !amount) {
        return res.status(400).json({ error: 'Product ID and amount are required' });
      }

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

      // Options de livraison
      const shippingOptions = {
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
        shippingOptions
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
