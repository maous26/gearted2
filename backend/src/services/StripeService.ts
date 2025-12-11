import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialiser Stripe avec ta clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

/**
 * STRIPE CONNECT STANDARD - Gearted Marketplace
 *
 * Mode: Paiements directs entre acheteurs et vendeurs
 * Commission: 10% flat prélevé automatiquement par Gearted
 *
 * Flow:
 * 1. Le vendeur crée son compte Stripe Connect Standard (onboarding)
 * 2. L'acheteur paie via PaymentIntent avec destination vers le compte vendeur
 * 3. Gearted prélève automatiquement 10% en application_fee
 * 4. Le vendeur reçoit 90% directement sur son compte Stripe
 */

// Commission Gearted: 10% flat
const GEARTED_COMMISSION_PERCENT = 10;

// Interface pour les options de livraison
interface ShippingOptions {
  shippingRateId?: string | null;
  shippingCost?: number;
  shippingProvider?: string | null;
}

export class StripeService {

  // ==========================================
  // STRIPE CONNECT STANDARD - Onboarding vendeur
  // ==========================================

  /**
   * Créer un compte Stripe Connect Standard pour un vendeur
   * Le vendeur sera redirigé vers Stripe pour compléter son onboarding
   */
  static async createConnectedAccount(userId: string, email: string) {
    try {
      // Vérifier si le vendeur a déjà un compte Stripe
      const existingAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (existingAccount) {
        // Retourner les infos existantes
        return {
          accountId: existingAccount.stripeAccountId,
          alreadyExists: true,
          chargesEnabled: existingAccount.chargesEnabled,
          payoutsEnabled: existingAccount.payoutsEnabled,
          onboardingComplete: existingAccount.onboardingComplete
        };
      }

      // Créer un compte Stripe Connect Standard
      const account = await stripe.accounts.create({
        type: 'standard',
        email,
        metadata: {
          userId,
          platform: 'gearted'
        }
      });

      // Enregistrer dans la DB
      await prisma.stripeAccount.create({
        data: {
          userId,
          stripeAccountId: account.id,
          accountType: 'standard',
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          onboardingComplete: false,
          country: 'FR',
          currency: 'eur'
        }
      });

      console.log(`[Stripe Connect] Created Standard account ${account.id} for user ${userId}`);

      return {
        accountId: account.id,
        alreadyExists: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to create account:', error);
      throw new Error(`Erreur création compte Stripe: ${error.message}`);
    }
  }

  /**
   * Créer un lien d'onboarding Stripe pour le vendeur
   * Le vendeur clique sur ce lien pour compléter son compte Stripe
   */
  static async createOnboardingLink(userId: string, returnUrl: string, refreshUrl: string) {
    try {
      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        throw new Error('Compte Stripe non trouvé. Créez d\'abord un compte.');
      }

      // Créer un Account Link pour l'onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });

      console.log(`[Stripe Connect] Created onboarding link for account ${stripeAccount.stripeAccountId}`);

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to create onboarding link:', error);
      throw new Error(`Erreur création lien onboarding: ${error.message}`);
    }
  }

  /**
   * Créer un lien vers le dashboard Stripe du vendeur (login link)
   */
  static async createDashboardLink(userId: string) {
    try {
      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        throw new Error('Compte Stripe non trouvé');
      }

      // Pour les comptes Standard, on utilise le login link
      const loginLink = await stripe.accounts.createLoginLink(stripeAccount.stripeAccountId);

      return {
        url: loginLink.url
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to create dashboard link:', error);
      throw new Error(`Erreur création lien dashboard: ${error.message}`);
    }
  }

  /**
   * Récupérer le statut du compte Stripe Connect d'un vendeur
   */
  static async getAccountStatus(userId: string) {
    try {
      const stripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId }
      });

      if (!stripeAccount) {
        return {
          hasAccount: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          onboardingComplete: false,
          detailsSubmitted: false
        };
      }

      // Récupérer les infos à jour depuis Stripe
      const account = await stripe.accounts.retrieve(stripeAccount.stripeAccountId);

      // Mettre à jour les infos dans notre DB
      const updatedAccount = await prisma.stripeAccount.update({
        where: { userId },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted || false,
          onboardingComplete: account.charges_enabled && account.payouts_enabled
        }
      });

      return {
        hasAccount: true,
        accountId: stripeAccount.stripeAccountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        onboardingComplete: account.charges_enabled && account.payouts_enabled,
        detailsSubmitted: account.details_submitted || false,
        requirements: account.requirements
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to get account status:', error);
      throw new Error(`Erreur récupération statut: ${error.message}`);
    }
  }

  // ==========================================
  // PAIEMENTS - Stripe Connect Standard
  // ==========================================

  /**
   * Créer un Payment Intent pour un achat
   *
   * STRIPE CONNECT STANDARD FLOW:
   * 1. L'acheteur paie le prix total (produit + livraison)
   * 2. Stripe transfère directement l'argent au compte du vendeur
   * 3. Gearted prélève automatiquement 10% via application_fee
   * 4. Le vendeur reçoit 90% immédiatement sur son compte Stripe
   *
   * Note: Pas d'escrow dans ce modèle - le paiement est immédiat
   */
  static async createPaymentIntent(
    productId: string,
    buyerId: string,
    sellerId: string,
    productPrice: number,
    currency: string = 'eur',
    shippingOptions?: ShippingOptions
  ) {
    try {
      // 1. Vérifier que le vendeur a un compte Stripe Connect actif
      const sellerStripeAccount = await prisma.stripeAccount.findUnique({
        where: { userId: sellerId }
      });

      if (!sellerStripeAccount) {
        throw new Error('Le vendeur n\'a pas configuré son compte de paiement Stripe');
      }

      if (!sellerStripeAccount.chargesEnabled) {
        throw new Error('Le compte de paiement du vendeur n\'est pas encore activé');
      }

      // 2. Calculer les montants
      const productPriceInCents = Math.round(productPrice * 100);
      const shippingCostInCents = Math.round((shippingOptions?.shippingCost || 0) * 100);

      // Total que l'acheteur paie
      const totalChargeInCents = productPriceInCents + shippingCostInCents;

      // Commission Gearted: 10% du prix du produit (pas de la livraison)
      const applicationFeeInCents = Math.round(productPriceInCents * (GEARTED_COMMISSION_PERCENT / 100));

      // Ce que le vendeur reçoit: prix produit - commission + livraison
      // Note: La livraison va au vendeur qui l'utilisera pour payer le transporteur
      const sellerAmountInCents = productPriceInCents - applicationFeeInCents + shippingCostInCents;

      console.log(`[Stripe Connect] Payment calculation:
        Product: ${productPrice}€
        Shipping: ${shippingCostInCents / 100}€
        Total charge: ${totalChargeInCents / 100}€
        Gearted commission (${GEARTED_COMMISSION_PERCENT}%): ${applicationFeeInCents / 100}€
        Seller receives: ${sellerAmountInCents / 100}€`);

      // 3. Créer le Payment Intent avec destination vers le compte vendeur
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalChargeInCents,
        currency,
        // STRIPE CONNECT: Transfert direct au vendeur avec commission
        application_fee_amount: applicationFeeInCents,
        transfer_data: {
          destination: sellerStripeAccount.stripeAccountId
        },
        // Capture automatique (pas d'escrow)
        capture_method: 'automatic',
        metadata: {
          productId,
          buyerId,
          sellerId,
          productPrice: productPrice.toFixed(2),
          shippingCost: (shippingCostInCents / 100).toFixed(2),
          applicationFee: (applicationFeeInCents / 100).toFixed(2),
          sellerAmount: (sellerAmountInCents / 100).toFixed(2),
          shippingRateId: shippingOptions?.shippingRateId || '',
          shippingProvider: shippingOptions?.shippingProvider || '',
          stripeConnectMode: 'standard'
        }
      });

      // 4. Enregistrer la transaction dans la DB
      await prisma.transaction.create({
        data: {
          productId,
          buyerId,
          amount: productPriceInCents / 100,
          currency: currency.toUpperCase(),
          buyerFeePercent: 0, // Pas de frais acheteur séparés
          sellerFeePercent: GEARTED_COMMISSION_PERCENT,
          buyerFee: 0,
          sellerFee: applicationFeeInCents / 100,
          platformFee: applicationFeeInCents / 100,
          sellerAmount: sellerAmountInCents / 100,
          totalPaid: totalChargeInCents / 100,
          paymentIntentId: paymentIntent.id,
          status: 'PENDING',
          shippingRateId: shippingOptions?.shippingRateId || null,
          shippingCost: shippingCostInCents / 100,
          shippingProvider: shippingOptions?.shippingProvider || null,
          metadata: {
            stripeConnectMode: 'standard',
            sellerStripeAccountId: sellerStripeAccount.stripeAccountId,
            applicationFee: applicationFeeInCents / 100
          }
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        productPrice,
        shippingCost: shippingCostInCents / 100,
        totalCharge: totalChargeInCents / 100,
        platformFee: applicationFeeInCents / 100,
        sellerAmount: sellerAmountInCents / 100,
        commissionPercent: GEARTED_COMMISSION_PERCENT
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to create payment intent:', error);
      throw new Error(`Erreur création paiement: ${error.message}`);
    }
  }

  // ==========================================
  // GESTION DES PAIEMENTS
  // ==========================================

  /**
   * Confirmer un paiement et mettre à jour le statut
   * Pour Stripe Connect Standard, le paiement est automatique (pas d'escrow)
   */
  static async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      let status: string;
      switch (paymentIntent.status) {
        case 'succeeded':
          status = 'SUCCEEDED';
          break;
        case 'processing':
          status = 'PROCESSING';
          break;
        case 'canceled':
          status = 'CANCELLED';
          break;
        default:
          status = 'FAILED';
      }

      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId },
        include: { product: true }
      });

      if (transaction) {
        const existingMetadata = (transaction.metadata as any) || {};

        await prisma.transaction.update({
          where: { paymentIntentId },
          data: {
            status: status as any,
            metadata: {
              ...existingMetadata,
              lastStatusUpdate: new Date().toISOString(),
            }
          }
        });

        // Si paiement réussi, marquer le produit comme vendu
        if (status === 'SUCCEEDED') {
          await prisma.product.update({
            where: { id: transaction.productId },
            data: {
              status: 'SOLD',
              soldAt: new Date()
            }
          });

          // Notification au vendeur
          await prisma.notification.create({
            data: {
              userId: transaction.product.sellerId,
              title: '💰 Vente confirmée !',
              message: `"${transaction.product.title}" a été vendu ! Vous recevrez ${Number(transaction.sellerAmount).toFixed(2)}€ sur votre compte Stripe.`,
              type: 'PAYMENT_UPDATE',
              data: {
                transactionId: transaction.id,
                amount: transaction.sellerAmount
              }
            }
          });

          // Notification à l'acheteur
          await prisma.notification.create({
            data: {
              userId: transaction.buyerId,
              title: '✅ Paiement confirmé',
              message: `Votre paiement de ${Number(transaction.totalPaid).toFixed(2)}€ pour "${transaction.product.title}" a été confirmé. Le vendeur va procéder à l'expédition.`,
              type: 'SUCCESS',
              data: {
                transactionId: transaction.id
              }
            }
          });
        }
      }

      console.log(`[Stripe Connect] Payment status: ${paymentIntentId} -> ${status}`);

      return { status, paymentIntent };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to confirm payment:', error);
      throw new Error(`Erreur confirmation paiement: ${error.message}`);
    }
  }

  /**
   * Rembourser une transaction
   * Note: Le remboursement passe par le compte du vendeur avec Stripe Connect
   */
  static async refundPayment(paymentIntentId: string, reason?: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Créer le remboursement
      // Avec Connect Standard, Stripe gère automatiquement le flux
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
      await prisma.product.update({
        where: { id: transaction.productId },
        data: { status: 'ACTIVE' }
      });

      console.log(`[Stripe Connect] Refund created for ${paymentIntentId}`);

      return { refund };
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to refund payment:', error);
      throw new Error(`Erreur remboursement: ${error.message}`);
    }
  }

  // ==========================================
  // WEBHOOKS
  // ==========================================

  /**
   * Gérer les webhooks Stripe
   *
   * Événements importants pour Connect Standard:
   * - account.updated: Mise à jour du compte vendeur
   * - payment_intent.succeeded: Paiement réussi
   * - payment_intent.payment_failed: Paiement échoué
   * - charge.refunded: Remboursement effectué
   */
  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        // Mise à jour du compte Connect d'un vendeur
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;

          // Vérifier si on a ce compte en DB
          const stripeAccount = await prisma.stripeAccount.findUnique({
            where: { stripeAccountId: account.id }
          });

          if (stripeAccount) {
            await prisma.stripeAccount.update({
              where: { stripeAccountId: account.id },
              data: {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted || false,
                onboardingComplete: account.charges_enabled && account.payouts_enabled,
              }
            });

            console.log(`[Stripe Connect] Account ${account.id} updated - charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`);

            // Si le compte est maintenant actif, notifier l'utilisateur
            if (account.charges_enabled && account.payouts_enabled) {
              await prisma.notification.create({
                data: {
                  userId: stripeAccount.userId,
                  title: '✅ Compte Stripe activé',
                  message: 'Votre compte de paiement est maintenant actif. Vous pouvez recevoir des paiements !',
                  type: 'SUCCESS'
                }
              });
            }
          }
          break;
        }

        // Paiement réussi
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Connect] Payment succeeded: ${paymentIntent.id}`);
          await this.confirmPayment(paymentIntent.id);
          break;
        }

        // Paiement échoué
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Connect] Payment failed: ${paymentIntent.id}`);

          const transaction = await prisma.transaction.findUnique({
            where: { paymentIntentId: paymentIntent.id }
          });

          if (transaction) {
            await prisma.transaction.update({
              where: { paymentIntentId: paymentIntent.id },
              data: { status: 'FAILED' }
            });

            // Notification à l'acheteur
            await prisma.notification.create({
              data: {
                userId: transaction.buyerId,
                title: '❌ Paiement échoué',
                message: 'Votre paiement n\'a pas pu être effectué. Veuillez réessayer ou utiliser un autre moyen de paiement.',
                type: 'ERROR',
                data: { transactionId: transaction.id }
              }
            });
          }
          break;
        }

        // Paiement annulé
        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Connect] Payment canceled: ${paymentIntent.id}`);

          const transaction = await prisma.transaction.findUnique({
            where: { paymentIntentId: paymentIntent.id }
          });

          if (transaction) {
            await prisma.transaction.update({
              where: { paymentIntentId: paymentIntent.id },
              data: { status: 'CANCELLED' }
            });

            // Remettre le produit en vente
            await prisma.product.update({
              where: { id: transaction.productId },
              data: { status: 'ACTIVE' }
            });
          }
          break;
        }

        // Remboursement effectué
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          if (charge.payment_intent) {
            console.log(`[Stripe Connect] Charge refunded for: ${charge.payment_intent}`);
            await prisma.transaction.update({
              where: { paymentIntentId: charge.payment_intent as string },
              data: { status: 'REFUNDED' }
            });
          }
          break;
        }

        default:
          console.log(`[Stripe Connect] Unhandled event: ${event.type}`);
      }

      return { received: true };
    } catch (error: any) {
      console.error('[Stripe Connect] Webhook error:', error);
      throw error;
    }
  }
}

export default StripeService;
