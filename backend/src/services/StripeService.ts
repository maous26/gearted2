import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialiser Stripe avec ta clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Commission par défaut de la plateforme Gearted (si pas de settings)
// 5% vendeur + 5% acheteur = 10% total pour Gearted
const DEFAULT_SELLER_FEE_PERCENT = 5; // 5% prélevé au vendeur
const DEFAULT_BUYER_FEE_PERCENT = 5;  // 5% ajouté à l'acheteur
const DEFAULT_SELLER_FEE_MIN = 0.50;  // Minimum 0.50€
const DEFAULT_BUYER_FEE_MIN = 0.50;   // Minimum 0.50€

// Interface pour les paramètres de commission
interface CommissionSettings {
  buyerEnabled: boolean;
  buyerFeePercent: number;
  buyerFeeMin: number;
  sellerEnabled: boolean;
  sellerFeePercent: number;
  sellerFeeMin: number;
}

// Interface pour les options premium + livraison
interface PremiumOptions {
  wantExpertise: boolean;
  wantInsurance: boolean;
  expertisePrice: number;
  insurancePrice: number;
  grandTotal?: number;
  // Livraison (payée par l'acheteur)
  shippingRateId?: string | null;
  shippingCost?: number;
  shippingProvider?: string | null;
}

// Fonction pour récupérer les paramètres de commission depuis la DB
async function getCommissionSettings(): Promise<CommissionSettings> {
  try {
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'commissions' }
    });
    
    if (settings?.value) {
      return {
        buyerEnabled: settings.value.buyerEnabled ?? true,
        buyerFeePercent: settings.value.buyerFeePercent ?? DEFAULT_BUYER_FEE_PERCENT,
        buyerFeeMin: settings.value.buyerFeeMin ?? DEFAULT_BUYER_FEE_MIN,
        sellerEnabled: settings.value.sellerEnabled ?? true,
        sellerFeePercent: settings.value.sellerFeePercent ?? DEFAULT_SELLER_FEE_PERCENT,
        sellerFeeMin: settings.value.sellerFeeMin ?? DEFAULT_SELLER_FEE_MIN
      };
    }
  } catch (error) {
    console.error('Error loading commission settings:', error);
  }
  
  // Valeurs par défaut si pas de settings
  return {
    buyerEnabled: true,
    buyerFeePercent: DEFAULT_BUYER_FEE_PERCENT,
    buyerFeeMin: DEFAULT_BUYER_FEE_MIN,
    sellerEnabled: true,
    sellerFeePercent: DEFAULT_SELLER_FEE_PERCENT,
    sellerFeeMin: DEFAULT_SELLER_FEE_MIN
  };
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
   * Commission dynamique basée sur les paramètres admin
   * Options premium: Expertise (19.90€) et Assurance (4.99€) pour l'acheteur
   */
  static async createPaymentIntent(
    productId: string,
    buyerId: string,
    sellerId: string,
    productPrice: number, // Prix du produit affiché (vendeur reçoit ce montant - commission)
    currency: string = 'eur',
    premiumOptions?: PremiumOptions
  ) {
    try {
      // Récupérer les paramètres de commission depuis la DB
      const commSettings = await getCommissionSettings();
      
      // Vérifier si l'acheteur ou le vendeur est exempté de commissions
      const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
      const seller = await prisma.user.findUnique({ where: { id: sellerId } });
      
      const buyerExempt = (buyer as any)?.exemptFromCommissions === true;
      const sellerExempt = (seller as any)?.exemptFromCommissions === true;
      
      // Récupérer le compte Stripe du vendeur (optionnel pour les tests)
      const sellerStripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId: sellerId }
      });

      // Pour les tests : permettre les paiements sans Stripe Connect
      const useStripeConnect = sellerStripeAccount && sellerStripeAccount.chargesEnabled;

      if (sellerStripeAccount && !sellerStripeAccount.chargesEnabled) {
        throw new Error('Le compte Stripe du vendeur n\'est pas encore activé');
      }

      // Calculer les montants de base avec commissions dynamiques
      const productPriceInCents = Math.round(productPrice * 100);
      
      // Commission vendeur (si activée et non exempté)
      let sellerFeeInCents = 0;
      if (commSettings.sellerEnabled && !sellerExempt) {
        sellerFeeInCents = Math.max(
          Math.round(productPriceInCents * (commSettings.sellerFeePercent / 100)),
          Math.round(commSettings.sellerFeeMin * 100)
        );
      }
      
      // Commission acheteur (si activée et non exempté)
      let buyerFeeInCents = 0;
      if (commSettings.buyerEnabled && !buyerExempt) {
        buyerFeeInCents = Math.max(
          Math.round(productPriceInCents * (commSettings.buyerFeePercent / 100)),
          Math.round(commSettings.buyerFeeMin * 100)
        );
      }

      // Options premium (100% pour Gearted)
      const expertisePriceInCents = premiumOptions?.wantExpertise ? Math.round((premiumOptions.expertisePrice || 19.90) * 100) : 0;
      const insurancePriceInCents = premiumOptions?.wantInsurance ? Math.round((premiumOptions.insurancePrice || 4.99) * 100) : 0;
      const premiumOptionsTotal = expertisePriceInCents + insurancePriceInCents;

      // Livraison (payée par l'acheteur, 100% reversé au transporteur via Gearted)
      const shippingCostInCents = Math.round((premiumOptions?.shippingCost || 0) * 100);

      const sellerAmountInCents = productPriceInCents - sellerFeeInCents; // Ce que le vendeur reçoit
      const totalChargeInCents = productPriceInCents + buyerFeeInCents + premiumOptionsTotal + shippingCostInCents;   // Ce que l'acheteur paie (produit + frais + options + livraison)
      const platformFeeInCents = sellerFeeInCents + buyerFeeInCents + premiumOptionsTotal;      // Commission totale Gearted (sans livraison qui est reversée)

      console.log(`[StripeService] Commission calculation:
        Product: ${productPrice}€
        Seller fee: ${commSettings.sellerEnabled ? commSettings.sellerFeePercent + '%' : 'disabled'} = ${sellerFeeInCents/100}€ ${sellerExempt ? '(EXEMPT)' : ''}
        Buyer fee: ${commSettings.buyerEnabled ? commSettings.buyerFeePercent + '%' : 'disabled'} = ${buyerFeeInCents/100}€ ${buyerExempt ? '(EXEMPT)' : ''}
        Seller receives: ${sellerAmountInCents/100}€
        Buyer pays: ${totalChargeInCents/100}€
        Platform fee: ${platformFeeInCents/100}€`);

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
          // Livraison
          shippingRateId: premiumOptions?.shippingRateId || '',
          shippingCost: (shippingCostInCents / 100).toFixed(2),
          shippingProvider: premiumOptions?.shippingProvider || '',
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
          buyerFeePercent: commSettings.buyerEnabled ? commSettings.buyerFeePercent : 0,
          sellerFeePercent: commSettings.sellerEnabled ? commSettings.sellerFeePercent : 0,
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
          // Livraison
          shippingRateId: premiumOptions?.shippingRateId || null,
          shippingCost: shippingCostInCents / 100,
          shippingProvider: premiumOptions?.shippingProvider || null,
          // Stocker les prix dans metadata
          metadata: {
            expertisePrice: expertisePriceInCents / 100,
            insurancePrice: insurancePriceInCents / 100,
            premiumOptionsTotal: premiumOptionsTotal / 100,
            shippingRateId: premiumOptions?.shippingRateId || null,
            shippingCost: shippingCostInCents / 100,
            shippingProvider: premiumOptions?.shippingProvider || null,
          }
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        productPrice: productPrice,
        buyerFee: buyerFeeInCents / 100,
        totalCharge: totalChargeInCents / 100,  // Ce que l'acheteur paie (produit + frais + options + livraison)
        sellerFee: sellerFeeInCents / 100,
        sellerAmount: sellerAmountInCents / 100,  // Ce que le vendeur reçoit
        platformFee: platformFeeInCents / 100,    // Commission totale Gearted (incluant options)
        // Options premium
        wantExpertise: premiumOptions?.wantExpertise || false,
        wantInsurance: premiumOptions?.wantInsurance || false,
        expertisePrice: expertisePriceInCents / 100,
        insurancePrice: insurancePriceInCents / 100,
        premiumOptionsTotal: premiumOptionsTotal / 100,
        // Livraison
        shippingRateId: premiumOptions?.shippingRateId || null,
        shippingCost: shippingCostInCents / 100,
        shippingProvider: premiumOptions?.shippingProvider || null,
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
