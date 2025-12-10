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

// Frais Stripe (approximation pour la France/Europe)
// Stripe charge ~1.4% + 0.25€ pour les cartes européennes, ~2.9% + 0.25€ pour les non-européennes
// On utilise une moyenne de 2.5% + 0.25€ pour être conservateur
const STRIPE_FEE_PERCENT = 2.5;
const STRIPE_FEE_FIXED = 0.25; // en euros

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

/**
 * MODÈLE C2C - Gearted Marketplace
 *
 * Tous les paiements sont collectés sur le compte Stripe de Gearted.
 * Les vendeurs reçoivent leurs paiements via virement IBAN.
 *
 * Les méthodes Stripe Connect (createConnectedAccount, createOnboardingLink, getAccountStatus)
 * ont été supprimées car les vendeurs n'ont pas besoin de compte Stripe.
 */
export class StripeService {

  /**
   * Créer un Payment Intent avec ESCROW (capture manuelle)
   *
   * ESCROW FLOW:
   * 1. Paiement autorisé mais NON capturé (fonds réservés sur la carte)
   * 2. Les fonds restent en attente jusqu'à confirmation de livraison
   * 3. À la livraison confirmée: capture des fonds et transfert au vendeur
   * 4. En cas de problème: annulation et remboursement automatique
   *
   * Les frais Stripe sont ABSORBÉS par Gearted (non répercutés sur l'acheteur)
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

      // MODÈLE C2C: Gearted collecte les paiements sur son compte Stripe
      // Les vendeurs reçoivent leur argent via virement IBAN (géré séparément)
      // Pas besoin de compte Stripe Connect pour les vendeurs

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

      // Calcul des frais Stripe (ABSORBÉS par Gearted)
      // Stripe: 2.5% + 0.25€ (moyenne Europe)
      const stripeFeeInCents = Math.round(totalChargeInCents * (STRIPE_FEE_PERCENT / 100)) + Math.round(STRIPE_FEE_FIXED * 100);

      // Commission plateforme APRÈS déduction des frais Stripe
      // Gearted absorbe les frais Stripe, donc on les déduit de notre marge
      const platformFeeInCents = sellerFeeInCents + buyerFeeInCents + premiumOptionsTotal;
      const netPlatformFeeInCents = platformFeeInCents - stripeFeeInCents; // Marge nette Gearted après frais Stripe

      console.log(`[StripeService] Commission calculation (ESCROW MODE):
        Product: ${productPrice}€
        Seller fee: ${commSettings.sellerEnabled ? commSettings.sellerFeePercent + '%' : 'disabled'} = ${sellerFeeInCents/100}€ ${sellerExempt ? '(EXEMPT)' : ''}
        Buyer fee: ${commSettings.buyerEnabled ? commSettings.buyerFeePercent + '%' : 'disabled'} = ${buyerFeeInCents/100}€ ${buyerExempt ? '(EXEMPT)' : ''}
        Premium options: ${premiumOptionsTotal/100}€
        Shipping: ${shippingCostInCents/100}€
        Seller receives: ${sellerAmountInCents/100}€
        Buyer pays: ${totalChargeInCents/100}€
        Stripe fees (absorbed by Gearted): ${stripeFeeInCents/100}€
        Gross platform fee: ${platformFeeInCents/100}€
        Net platform fee: ${netPlatformFeeInCents/100}€`);

      // Créer le Payment Intent avec CAPTURE MANUELLE (escrow)
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalChargeInCents,  // Montant total facturé à l'acheteur
        currency,
        // ESCROW: Capture manuelle - les fonds sont autorisés mais non capturés
        // Ils seront capturés après confirmation de livraison
        capture_method: 'manual',
        metadata: {
          productId,
          buyerId,
          sellerId,
          productPrice: productPrice.toFixed(2),
          sellerFee: (sellerFeeInCents / 100).toFixed(2),
          buyerFee: (buyerFeeInCents / 100).toFixed(2),
          platformFee: (platformFeeInCents / 100).toFixed(2),
          netPlatformFee: (netPlatformFeeInCents / 100).toFixed(2),
          stripeFeeAbsorbed: (stripeFeeInCents / 100).toFixed(2),
          sellerAmount: (sellerAmountInCents / 100).toFixed(2),
          escrowStatus: 'AUTHORIZED', // Suivi du statut escrow
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

      // MODÈLE C2C: Tous les paiements vont sur le compte Stripe de Gearted
      // Le paiement au vendeur se fait via virement IBAN après confirmation de livraison
      // (géré dans la console admin ou automatiquement via un système de payout)

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
          status: 'PENDING', // Sera PROCESSING après autorisation, SUCCEEDED après capture
          // Options premium - utiliser les champs existants
          hasExpert: premiumOptions?.wantExpertise || false,
          hasProtection: premiumOptions?.wantInsurance || false,
          // Livraison
          shippingRateId: premiumOptions?.shippingRateId || null,
          shippingCost: shippingCostInCents / 100,
          shippingProvider: premiumOptions?.shippingProvider || null,
          // Stocker les prix et infos escrow dans metadata
          metadata: {
            expertisePrice: expertisePriceInCents / 100,
            insurancePrice: insurancePriceInCents / 100,
            premiumOptionsTotal: premiumOptionsTotal / 100,
            shippingRateId: premiumOptions?.shippingRateId || null,
            shippingCost: shippingCostInCents / 100,
            shippingProvider: premiumOptions?.shippingProvider || null,
            // Escrow tracking
            escrowStatus: 'AUTHORIZED',
            stripeFeeAbsorbed: stripeFeeInCents / 100,
            netPlatformFee: netPlatformFeeInCents / 100,
            // MODÈLE C2C: Pas de Stripe Connect vendeur, paiement via IBAN
            payoutMethod: 'IBAN',
            payoutStatus: 'PENDING', // Sera 'COMPLETED' après virement au vendeur
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
        stripeFeeAbsorbed: stripeFeeInCents / 100, // Frais Stripe absorbés par Gearted
        netPlatformFee: netPlatformFeeInCents / 100, // Marge nette Gearted
        escrowEnabled: true, // Indicateur escrow actif
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
   * ESCROW: Capturer les fonds et transférer au vendeur
   *
   * DEUX CAS DE FIGURE:
   *
   * 1. VENTE SIMPLE (hasExpert = false):
   *    - Vendeur expédie directement à l'acheteur
   *    - Capture déclenchée quand l'acheteur confirme la réception
   *    - Fonds transférés au vendeur immédiatement après capture
   *
   * 2. VENTE AVEC EXPERT GEARTED (hasExpert = true):
   *    - Vendeur expédie à Gearted
   *    - Gearted vérifie le produit
   *    - Gearted expédie à l'acheteur
   *    - Capture déclenchée quand l'acheteur confirme la réception finale
   *    - Fonds transférés au vendeur après livraison confirmée à l'acheteur
   *
   * @param paymentIntentId - ID du PaymentIntent Stripe
   * @param source - Source de la capture ('buyer_confirmed' | 'expert_delivered' | 'admin')
   */
  static async captureAndTransfer(paymentIntentId: string, source: string = 'buyer_confirmed') {
    try {
      // Récupérer la transaction avec les infos Expert si applicable
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId },
        include: {
          product: true
        }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      const metadata = transaction.metadata as any;
      const hasExpert = transaction.hasExpert;

      // Vérifier si c'est une vente Expert
      if (hasExpert) {
        // Vérifier que le service Expert a bien été livré à l'acheteur
        const expertService = await (prisma as any).expertService.findUnique({
          where: { transactionId: transaction.id }
        });

        if (!expertService) {
          throw new Error('Service Expert non trouvé pour cette transaction');
        }

        // Pour Expert: on ne capture que si le colis est livré à l'acheteur
        if (expertService.status !== 'DELIVERED' && expertService.status !== 'COMPLETED') {
          throw new Error(`La capture n'est pas autorisée. Statut Expert: ${expertService.status}. Le colis doit être livré à l'acheteur.`);
        }

        console.log(`[Stripe] Expert service validated - status: ${expertService.status}`);
      }

      // 1. Capturer le paiement (retirer les fonds de la carte)
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Capture échouée: ${paymentIntent.status}`);
      }

      console.log(`[Stripe] Payment captured: ${paymentIntentId} (${hasExpert ? 'EXPERT' : 'SIMPLE'} sale, source: ${source})`);

      // MODÈLE C2C: Les fonds sont capturés sur le compte Stripe de Gearted
      // Le paiement au vendeur se fait via virement IBAN depuis la console admin
      // Le statut payoutStatus sera mis à jour manuellement après le virement

      // 2. Mettre à jour la transaction
      await prisma.transaction.update({
        where: { paymentIntentId },
        data: {
          status: 'SUCCEEDED',
          metadata: {
            ...metadata,
            escrowStatus: 'CAPTURED',
            capturedAt: new Date().toISOString(),
            captureSource: source,
            saleType: hasExpert ? 'expert' : 'simple',
            // Le payout au vendeur est en attente (sera fait via IBAN)
            payoutStatus: 'PENDING_PAYOUT',
          }
        }
      });

      // 4. Marquer le produit comme vendu (définitivement)
      await prisma.product.update({
        where: { id: transaction.productId },
        data: {
          status: 'SOLD',
          soldAt: new Date()
        }
      });

      // 5. Si Expert, marquer le service comme terminé
      if (hasExpert) {
        await (prisma as any).expertService.update({
          where: { transactionId: transaction.id },
          data: { status: 'COMPLETED' }
        });
      }

      // 6. Créer une notification pour le vendeur
      // MODÈLE C2C: Le vendeur sera payé via IBAN, on l'informe que le paiement est validé
      await prisma.notification.create({
        data: {
          userId: transaction.product.sellerId,
          title: '✅ Vente confirmée !',
          message: `La vente de "${transaction.product.title}" est finalisée ! Votre paiement de ${Number(transaction.sellerAmount).toFixed(2)}€ sera versé sur votre compte bancaire sous 2-3 jours ouvrés.${hasExpert ? ' (Vente avec Expert Gearted)' : ''}`,
          type: 'PAYMENT_UPDATE',
          data: {
            transactionId: transaction.id,
            amount: transaction.sellerAmount,
            saleType: hasExpert ? 'expert' : 'simple',
            payoutStatus: 'PENDING_PAYOUT'
          }
        }
      });

      return {
        success: true,
        paymentIntent,
        saleType: hasExpert ? 'expert' : 'simple',
        sellerAmount: Number(transaction.sellerAmount),
        message: `Paiement capturé ! Le vendeur recevra ${Number(transaction.sellerAmount).toFixed(2)}€ via virement bancaire (${hasExpert ? 'vente Expert' : 'vente simple'})`
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to capture and transfer:', error);
      throw new Error(`Erreur capture/transfert: ${error.message}`);
    }
  }

  /**
   * VENTE SIMPLE: L'acheteur confirme la réception du colis
   * Déclenche la capture escrow et le transfert au vendeur
   */
  static async confirmDeliverySimple(transactionId: string, buyerId: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { product: true }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (transaction.buyerId !== buyerId) {
        throw new Error('Seul l\'acheteur peut confirmer la réception');
      }

      if (transaction.hasExpert) {
        throw new Error('Cette transaction utilise Expert Gearted. La confirmation se fait via le service Expert.');
      }

      if (transaction.status === 'SUCCEEDED') {
        throw new Error('Cette transaction est déjà finalisée');
      }

      // Capturer et transférer
      const result = await this.captureAndTransfer(transaction.paymentIntentId, 'buyer_confirmed');

      // Notification à l'acheteur
      await prisma.notification.create({
        data: {
          userId: buyerId,
          title: '✅ Réception confirmée',
          message: `Merci d'avoir confirmé la réception de "${transaction.product.title}". Le vendeur a été payé.`,
          type: 'SUCCESS',
          data: { transactionId }
        }
      });

      return result;
    } catch (error: any) {
      console.error('[Stripe] Failed to confirm simple delivery:', error);
      throw new Error(`Erreur confirmation livraison: ${error.message}`);
    }
  }

  /**
   * VENTE EXPERT: Appelé par ExpertService quand le colis est livré à l'acheteur final
   * Déclenche la capture escrow et le transfert au vendeur
   */
  static async confirmDeliveryExpert(transactionId: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { product: true }
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (!transaction.hasExpert) {
        throw new Error('Cette transaction n\'utilise pas Expert Gearted');
      }

      // Vérifier le statut du service Expert
      const expertService = await (prisma as any).expertService.findUnique({
        where: { transactionId }
      });

      if (!expertService || (expertService.status !== 'DELIVERED' && expertService.status !== 'COMPLETED')) {
        throw new Error('Le service Expert doit être en statut DELIVERED pour confirmer');
      }

      // Capturer et transférer
      const result = await this.captureAndTransfer(transaction.paymentIntentId, 'expert_delivered');

      return result;
    } catch (error: any) {
      console.error('[Stripe] Failed to confirm expert delivery:', error);
      throw new Error(`Erreur confirmation livraison Expert: ${error.message}`);
    }
  }

  /**
   * ESCROW: Annuler l'autorisation (pas de capture, remboursement automatique)
   * Appelé en cas de problème avant livraison
   */
  static async cancelEscrow(paymentIntentId: string, reason?: string) {
    try {
      // Annuler le PaymentIntent (libère l'autorisation sur la carte)
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: 'requested_by_customer'
      });

      // Mettre à jour la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId }
      });

      if (transaction) {
        const metadata = transaction.metadata as any;
        await prisma.transaction.update({
          where: { paymentIntentId },
          data: {
            status: 'CANCELLED',
            metadata: {
              ...metadata,
              escrowStatus: 'CANCELLED',
              cancelledAt: new Date().toISOString(),
              cancellationReason: reason || 'user_requested'
            }
          }
        });

        // Remettre le produit en vente
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { status: 'ACTIVE' }
        });
      }

      console.log(`[Stripe] Escrow cancelled: ${paymentIntentId}`);

      return {
        success: true,
        paymentIntent,
        message: 'Autorisation annulée, aucun prélèvement effectué'
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to cancel escrow:', error);
      throw new Error(`Erreur annulation escrow: ${error.message}`);
    }
  }

  /**
   * Confirmer un paiement et mettre à jour le statut
   *
   * ESCROW FLOW:
   * - 'requires_capture' = Paiement autorisé, en attente de capture (escrow actif)
   * - 'succeeded' = Paiement capturé (après livraison confirmée)
   * - 'canceled' = Paiement annulé (escrow libéré)
   */
  static async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Mapper le statut Stripe vers le statut de transaction
      // ESCROW: 'requires_capture' signifie que les fonds sont réservés (autorisés) mais pas encore capturés
      let status: string;
      let escrowStatus: string;

      switch (paymentIntent.status) {
        case 'requires_capture':
          // ESCROW ACTIF: Fonds autorisés, en attente de confirmation livraison
          status = 'PROCESSING';
          escrowStatus = 'AUTHORIZED';
          break;
        case 'succeeded':
          // Fonds capturés (après livraison)
          status = 'SUCCEEDED';
          escrowStatus = 'CAPTURED';
          break;
        case 'processing':
          status = 'PROCESSING';
          escrowStatus = 'PROCESSING';
          break;
        case 'canceled':
          status = 'CANCELLED';
          escrowStatus = 'CANCELLED';
          break;
        default:
          status = 'FAILED';
          escrowStatus = 'FAILED';
      }

      // Récupérer la transaction pour mettre à jour les metadata
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntentId }
      });

      const existingMetadata = (transaction?.metadata as any) || {};

      await prisma.transaction.update({
        where: { paymentIntentId },
        data: {
          status: status as any,
          metadata: {
            ...existingMetadata,
            escrowStatus,
            lastStatusUpdate: new Date().toISOString(),
          }
        }
      });

      // ESCROW: Ne PAS marquer le produit comme vendu tant que les fonds ne sont pas capturés
      // Le produit sera marqué comme SOLD seulement après capture (dans captureAndTransfer)
      // Pour l'instant, on le marque comme "réservé" (pas de changement de status car déjà géré)

      console.log(`[Stripe] Payment status updated: ${paymentIntentId} -> ${status} (escrow: ${escrowStatus})`);

      return { status, escrowStatus, paymentIntent };
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
   *
   * ESCROW EVENTS:
   * - payment_intent.amount_capturable_updated: Fonds autorisés (escrow actif)
   * - payment_intent.succeeded: Fonds capturés (après livraison)
   * - payment_intent.canceled: Escrow annulé
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

        // ESCROW: Fonds autorisés mais pas encore capturés
        case 'payment_intent.amount_capturable_updated': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe] ESCROW: Funds authorized for ${paymentIntent.id} - Amount: ${paymentIntent.amount_capturable/100}€`);

          // Mettre à jour la transaction en mode escrow
          const transaction = await prisma.transaction.findUnique({
            where: { paymentIntentId: paymentIntent.id }
          });

          if (transaction) {
            const metadata = (transaction.metadata as any) || {};
            await prisma.transaction.update({
              where: { paymentIntentId: paymentIntent.id },
              data: {
                status: 'PROCESSING', // Fonds autorisés, en attente de livraison
                metadata: {
                  ...metadata,
                  escrowStatus: 'AUTHORIZED',
                  authorizedAt: new Date().toISOString(),
                  amountCapturable: paymentIntent.amount_capturable / 100,
                }
              }
            });

            // Créer notification pour l'acheteur
            await prisma.notification.create({
              data: {
                userId: transaction.buyerId,
                title: '💳 Paiement autorisé',
                message: `Votre paiement de ${paymentIntent.amount/100}€ a été autorisé. Les fonds seront prélevés une fois la livraison confirmée.`,
                type: 'PAYMENT_UPDATE',
                data: {
                  transactionId: transaction.id,
                  escrowStatus: 'AUTHORIZED'
                }
              }
            });
          }
          break;
        }

        // Paiement capturé (après confirmation livraison)
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.confirmPayment(paymentIntent.id);
          break;
        }

        // ESCROW: Paiement annulé (escrow libéré)
        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe] ESCROW: Payment canceled for ${paymentIntent.id}`);

          const transaction = await prisma.transaction.findUnique({
            where: { paymentIntentId: paymentIntent.id }
          });

          if (transaction) {
            const metadata = (transaction.metadata as any) || {};
            await prisma.transaction.update({
              where: { paymentIntentId: paymentIntent.id },
              data: {
                status: 'CANCELLED',
                metadata: {
                  ...metadata,
                  escrowStatus: 'CANCELLED',
                  cancelledAt: new Date().toISOString(),
                }
              }
            });

            // Remettre le produit en vente
            await prisma.product.update({
              where: { id: transaction.productId },
              data: { status: 'ACTIVE' }
            });
          }
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
}

export default StripeService;
