import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Feature flag: Activé pour les tests
const STRIPE_CONNECT_ENABLED = true;

export class StripeController {
  /**
   * Créer un compte Stripe Connect pour le vendeur (onboarding)
   * POST /api/stripe/connect/account
   */
  static async createConnectedAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { email, country = 'FR' } = req.body;

      const result = await StripeService.createConnectedAccount(userId, email, country);

      return res.json(result);
    } catch (error: any) {
      console.error('[Stripe] Create account error:', error);
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

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        return res.json({
          success: true,
          hasAccount: false
        });
      }

      const status = await StripeService.getAccountStatus(stripeAccount.stripeAccountId);

      return res.json({
        success: true,
        hasAccount: true,
        accountId: stripeAccount.stripeAccountId,
        ...status,
        onboardingComplete: stripeAccount.onboardingComplete
      });
    } catch (error: any) {
      console.error('[Stripe] Get status error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Créer un nouveau lien d'onboarding
   * POST /api/stripe/connect/onboarding-link
   */
  static async createOnboardingLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        return res.status(404).json({ error: 'Stripe account not found' });
      }

      const onboardingUrl = await StripeService.createOnboardingLink(stripeAccount.stripeAccountId);

      return res.json({
        success: true,
        onboardingUrl
      });
    } catch (error: any) {
      console.error('[Stripe] Create onboarding link error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Créer un lien vers le dashboard Stripe Express
   * GET /api/stripe/connect/dashboard
   */
  static async getDashboardLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        return res.status(404).json({ error: 'Stripe account not found' });
      }

      const dashboardUrl = await StripeService.createDashboardLink(stripeAccount.stripeAccountId);

      return res.json({
        success: true,
        dashboardUrl
      });
    } catch (error: any) {
      console.error('[Stripe] Get dashboard link error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

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

      const { productId, amount, currency = 'eur' } = req.body;

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

      const result = await StripeService.createPaymentIntent(
        productId,
        userId,
        product.sellerId,
        amount,
        currency
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
        status: result.status
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
