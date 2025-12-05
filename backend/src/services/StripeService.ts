import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialiser Stripe avec ta clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Commission de la plateforme Gearted
// 5% vendeur + 5% acheteur = 10% total pour Gearted
const SELLER_FEE_PERCENT = 5; // 5% prélevé au vendeur
const BUYER_FEE_PERCENT = 5;  // 5% ajouté à l'acheteur

// Interface pour les options premium
interface PremiumOptions {
  wantExpertise: boolean;
  wantInsurance: boolean;
  expertisePrice: number;
  insurancePrice: number;
  grandTotal?: number;
}

export class StripeService {
  /**
   * Créer un compte Stripe Connect pour un vendeur
   */
  static async createConnectedAccount(userId: string, email: string, country: string = 'FR') {
    try {
      // Vérifier si l'utilisateur a déjà un compte Stripe
      const existingAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (existingAccount) {
        return {
          success: true,
          accountId: existingAccount.stripeAccountId,
          onboardingUrl: await this.createOnboardingLink(existingAccount.stripeAccountId)
        };
      }

      // Créer un nouveau compte Stripe Connect (Express)
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      // Sauvegarder dans la base de données
      await prisma.stripeAccount.create({
        data: {
          userId,
          stripeAccountId: account.id,
          accountType: 'express',
          country,
          currency: 'eur',
        }
      });

      // Créer un lien d'onboarding
      const onboardingUrl = await this.createOnboardingLink(account.id);

      return {
        success: true,
        accountId: account.id,
        onboardingUrl
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to create connected account:', error);
      throw new Error(`Failed to create Stripe account: ${error.message}`);
    }
  }

  /**
   * Créer un lien d'onboarding Stripe Connect
   */
  static async createOnboardingLink(accountId: string): Promise<string> {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/seller/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/seller/onboarding/complete`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Vérifier le statut d'un compte Stripe Connect
   */
  static async getAccountStatus(accountId: string) {
    try {
      const account = await stripe.accounts.retrieve(accountId);

      // Mettre à jour dans la DB
      await prisma.stripeAccount.update({
        where: { stripeAccountId: accountId },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: account.charges_enabled && account.payouts_enabled,
        }
      });

      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to get account status:', error);
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  /**
   * Créer un Payment Intent avec destination charge (split payment)
   * Commission: 5% vendeur + 5% acheteur = 10% total pour Gearted
   * Options premium: Expertise (19.90€) et Assurance (4.99€) pour l'acheteur
   */
  static async createPaymentIntent(
    productId: string,
    buyerId: string,
    sellerId: string,
    productPrice: number, // Prix du produit affiché (vendeur reçoit ce montant - 5%)
    currency: string = 'eur',
    premiumOptions?: PremiumOptions
  ) {
    try {
      // Récupérer le compte Stripe du vendeur (optionnel pour les tests)
      const sellerStripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId: sellerId }
      });

      // Pour les tests : permettre les paiements sans Stripe Connect
      const useStripeConnect = sellerStripeAccount && sellerStripeAccount.chargesEnabled;

      if (sellerStripeAccount && !sellerStripeAccount.chargesEnabled) {
        throw new Error('Le compte Stripe du vendeur n\'est pas encore activé');
      }

      // Calculer les montants de base
      // Prix produit: 100€
      // Commission vendeur (5%): 5€ → Vendeur reçoit 95€
      // Commission acheteur (5%): 5€ → Acheteur paie 105€
      // Total commission Gearted: 10€

      const productPriceInCents = Math.round(productPrice * 100);
      const sellerFeeInCents = Math.round(productPriceInCents * (SELLER_FEE_PERCENT / 100));
      const buyerFeeInCents = Math.round(productPriceInCents * (BUYER_FEE_PERCENT / 100));

      // Options premium (100% pour Gearted)
      const expertisePriceInCents = premiumOptions?.wantExpertise ? Math.round((premiumOptions.expertisePrice || 19.90) * 100) : 0;
      const insurancePriceInCents = premiumOptions?.wantInsurance ? Math.round((premiumOptions.insurancePrice || 4.99) * 100) : 0;
      const premiumOptionsTotal = expertisePriceInCents + insurancePriceInCents;

      const sellerAmountInCents = productPriceInCents - sellerFeeInCents; // Ce que le vendeur reçoit
      const totalChargeInCents = productPriceInCents + buyerFeeInCents + premiumOptionsTotal;   // Ce que l'acheteur paie (avec options)
      const platformFeeInCents = sellerFeeInCents + buyerFeeInCents + premiumOptionsTotal;      // Commission totale Gearted (incluant options)

      // Créer le Payment Intent
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalChargeInCents,  // Montant total facturé à l'acheteur
        currency,
        metadata: {
          productId,
          buyerId,
          sellerId,
          productPrice: productPrice.toFixed(2),
          sellerFee: (sellerFeeInCents / 100).toFixed(2),
          buyerFee: (buyerFeeInCents / 100).toFixed(2),
          platformFee: (platformFeeInCents / 100).toFixed(2),
          sellerAmount: (sellerAmountInCents / 100).toFixed(2),
          // Options premium
          wantExpertise: premiumOptions?.wantExpertise ? 'true' : 'false',
          wantInsurance: premiumOptions?.wantInsurance ? 'true' : 'false',
          expertisePrice: (expertisePriceInCents / 100).toFixed(2),
          insurancePrice: (insurancePriceInCents / 100).toFixed(2),
          premiumOptionsTotal: (premiumOptionsTotal / 100).toFixed(2),
        }
      };

      // Si Stripe Connect est configuré, utiliser destination charge
      if (useStripeConnect && sellerStripeAccount) {
        paymentIntentParams.application_fee_amount = platformFeeInCents;
        paymentIntentParams.transfer_data = {
          destination: sellerStripeAccount.stripeAccountId,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Enregistrer la transaction dans la DB (avec les nouveaux champs de commission)
      await (prisma as any).transaction.create({
        data: {
          productId,
          buyerId,
          amount: productPriceInCents / 100,     // Prix du produit (sans frais)
          currency: currency.toUpperCase(),
          buyerFeePercent: BUYER_FEE_PERCENT,    // 5%
          sellerFeePercent: SELLER_FEE_PERCENT,  // 5%
          buyerFee: buyerFeeInCents / 100,       // Commission acheteur
          sellerFee: sellerFeeInCents / 100,     // Commission vendeur
          platformFee: platformFeeInCents / 100, // Commission totale Gearted (incluant options)
          sellerAmount: sellerAmountInCents / 100, // Montant vendeur
          totalPaid: totalChargeInCents / 100,   // Total payé par l'acheteur
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
          // Options premium - utiliser les champs existants
          hasExpert: premiumOptions?.wantExpertise || false,
          hasProtection: premiumOptions?.wantInsurance || false,
          // Stocker les prix dans metadata
          metadata: {
            expertisePrice: expertisePriceInCents / 100,
            insurancePrice: insurancePriceInCents / 100,
            premiumOptionsTotal: premiumOptionsTotal / 100,
          }
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        productPrice: productPrice,
        buyerFee: buyerFeeInCents / 100,
        totalCharge: totalChargeInCents / 100,  // Ce que l'acheteur paie (avec options)
        sellerFee: sellerFeeInCents / 100,
        sellerAmount: sellerAmountInCents / 100,  // Ce que le vendeur reçoit
        platformFee: platformFeeInCents / 100,    // Commission totale Gearted (incluant options)
        // Options premium
        wantExpertise: premiumOptions?.wantExpertise || false,
        wantInsurance: premiumOptions?.wantInsurance || false,
        expertisePrice: expertisePriceInCents / 100,
        insurancePrice: insurancePriceInCents / 100,
        premiumOptionsTotal: premiumOptionsTotal / 100,
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to create payment intent:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Confirmer un paiement et mettre à jour le statut
   */
  static async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Mettre à jour la transaction dans la DB
      const status = paymentIntent.status === 'succeeded' ? 'SUCCEEDED' :
                     paymentIntent.status === 'processing' ? 'PROCESSING' :
                     paymentIntent.status === 'canceled' ? 'CANCELLED' : 'FAILED';

      await prisma.transaction.update({
        where: { paymentIntentId },
        data: {
          status,
          transferId: typeof paymentIntent.transfer_data?.destination === 'string'
            ? paymentIntent.transfer_data.destination
            : paymentIntent.transfer_data?.destination?.id || null,
        }
      });

      // Si le paiement est réussi, marquer le produit comme vendu
      if (status === 'SUCCEEDED') {
        const transaction = await prisma.transaction.findUnique({
          where: { paymentIntentId }
        });

        if (transaction) {
          await prisma.product.update({
            where: { id: transaction.productId },
            data: { status: 'SOLD' }
          });
        }
      }

      return { status, paymentIntent };
    } catch (error: any) {
      console.error('[Stripe] Failed to confirm payment:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Rembourser une transaction
   */
  static async refundPayment(paymentIntentId: string, reason?: string) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason as any,
      });

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { paymentIntentId },
        data: { status: 'REFUNDED' }
      });

      // Remettre le produit en vente
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId }
      });

      if (transaction) {
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { status: 'ACTIVE' }
        });
      }

      return { refund };
    } catch (error: any) {
      console.error('[Stripe] Failed to refund payment:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Gérer les webhooks Stripe
   */
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          await prisma.stripeAccount.update({
            where: { stripeAccountId: account.id },
            data: {
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
              detailsSubmitted: account.details_submitted,
              onboardingComplete: account.charges_enabled && account.payouts_enabled,
            }
          });
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.confirmPayment(paymentIntent.id);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await prisma.transaction.update({
            where: { paymentIntentId: paymentIntent.id },
            data: { status: 'FAILED' }
          });
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          if (charge.payment_intent) {
            await prisma.transaction.update({
              where: { paymentIntentId: charge.payment_intent as string },
              data: { status: 'REFUNDED' }
            });
          }
          break;
        }

        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error: any) {
      console.error('[Stripe] Webhook handling failed:', error);
      throw error;
    }
  }

  /**
   * Récupérer le dashboard login link pour un vendeur
   */
  static async createDashboardLink(accountId: string) {
    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return loginLink.url;
    } catch (error: any) {
      console.error('[Stripe] Failed to create dashboard link:', error);
      throw new Error(`Failed to create dashboard link: ${error.message}`);
    }
  }
}

export default StripeService;
