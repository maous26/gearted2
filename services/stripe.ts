import { Alert, Linking, Platform } from 'react-native';
import api from './api';

/**
 * STRIPE CONNECT STANDARD - Gearted Marketplace
 *
 * Mode: Paiements directs entre acheteurs et vendeurs
 * Commission: 10% automatiquement prélevé par Gearted
 */

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  productPrice: number;
  shippingCost: number;
  totalCharge: number;
  platformFee: number;
  sellerAmount: number;
  commissionPercent: number;
}

export interface ShippingOptions {
  shippingRateId?: string | null;
  shippingCost?: number;
  shippingProvider?: string | null;
}

export interface StripePublicKeyResponse {
  publishableKey: string;
}

// ==========================================
// STRIPE CONNECT - Types
// ==========================================

export interface StripeAccountStatus {
  success: boolean;
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  detailsSubmitted: boolean;
  requirements?: any;
}

export interface OnboardingLinkResponse {
  success: boolean;
  url: string;
  expiresAt?: number;
}

export interface DashboardLinkResponse {
  success: boolean;
  url: string;
}

/**
 * Service pour gérer les paiements Stripe et Stripe Connect
 */
class StripeService {

  // ==========================================
  // STRIPE CONNECT - Onboarding vendeur
  // ==========================================

  /**
   * Récupérer le statut du compte Stripe Connect de l'utilisateur
   */
  async getAccountStatus(): Promise<StripeAccountStatus> {
    try {
      const response = await api.get<StripeAccountStatus>('/api/stripe/connect/status');
      return response;
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to get account status:', error);
      // Retourner un statut par défaut si pas de compte
      return {
        success: false,
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        detailsSubmitted: false
      };
    }
  }

  /**
   * Créer un compte Stripe Connect Standard pour l'utilisateur
   */
  async createConnectedAccount(): Promise<{ success: boolean; accountId?: string; alreadyExists?: boolean }> {
    try {
      const response = await api.post<{ success: boolean; accountId: string; alreadyExists: boolean }>(
        '/api/stripe/connect/create-account'
      );
      return response;
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to create account:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la création du compte Stripe');
    }
  }

  /**
   * Obtenir un lien d'onboarding Stripe et l'ouvrir
   * Le vendeur sera redirigé vers Stripe pour compléter son compte
   */
  async startOnboarding(returnUrl: string, refreshUrl: string): Promise<string> {
    try {
      // D'abord, s'assurer qu'un compte existe
      await this.createConnectedAccount();

      // Ensuite, obtenir le lien d'onboarding
      const response = await api.post<OnboardingLinkResponse>('/api/stripe/connect/onboarding-link', {
        returnUrl,
        refreshUrl
      });

      if (!response.success || !response.url) {
        throw new Error('Impossible de générer le lien d\'onboarding');
      }

      return response.url;
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to start onboarding:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'onboarding Stripe');
    }
  }

  /**
   * Ouvrir le lien d'onboarding dans le navigateur
   */
  async openOnboarding(returnUrl: string, refreshUrl: string): Promise<void> {
    try {
      const url = await this.startOnboarding(returnUrl, refreshUrl);

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Impossible d\'ouvrir le lien Stripe');
      }
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to open onboarding:', error);
      throw error;
    }
  }

  /**
   * Ouvrir le dashboard Stripe du vendeur
   */
  async openDashboard(): Promise<void> {
    try {
      const response = await api.get<DashboardLinkResponse>('/api/stripe/connect/dashboard-link');

      if (!response.success || !response.url) {
        throw new Error('Impossible de générer le lien vers le dashboard');
      }

      const canOpen = await Linking.canOpenURL(response.url);
      if (canOpen) {
        await Linking.openURL(response.url);
      } else {
        throw new Error('Impossible d\'ouvrir le dashboard Stripe');
      }
    } catch (error: any) {
      console.error('[Stripe Connect] Failed to open dashboard:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'ouverture du dashboard');
    }
  }

  /**
   * Vérifier si l'utilisateur peut recevoir des paiements
   */
  async canReceivePayments(): Promise<boolean> {
    const status = await this.getAccountStatus();
    return status.hasAccount && status.chargesEnabled && status.payoutsEnabled;
  }

  // ==========================================
  // PAIEMENTS
  // ==========================================

  /**
   * Récupérer la clé publique Stripe depuis le backend
   */
  async getPublishableKey(): Promise<string> {
    try {
      const response = await api.get<StripePublicKeyResponse>('/api/stripe/public-key');
      return response.publishableKey;
    } catch (error: any) {
      console.error('[Stripe] Failed to get publishable key:', error);
      throw new Error('Impossible de récupérer la clé Stripe');
    }
  }

  /**
   * Créer un Payment Intent pour acheter un produit
   * Le paiement va directement au vendeur avec 10% de commission pour Gearted
   */
  async createPaymentIntent(
    productId: string,
    amount: number,
    currency: string = 'eur',
    shippingOptions?: ShippingOptions
  ): Promise<PaymentIntentResponse> {
    try {
      const response = await api.post<PaymentIntentResponse>('/api/stripe/create-payment-intent', {
        productId,
        amount,
        currency,
        ...(shippingOptions && {
          shippingRateId: shippingOptions.shippingRateId,
          shippingCost: shippingOptions.shippingCost,
          shippingProvider: shippingOptions.shippingProvider,
        })
      });

      if (!response.success) {
        throw new Error('Échec de la création du paiement');
      }

      return response;
    } catch (error: any) {
      console.error('[Stripe] Failed to create payment intent:', error);

      // Messages d'erreur personnalisés
      const errorMsg = error.response?.data?.error || error.message;

      if (error.response?.status === 404) {
        throw new Error('Produit introuvable');
      } else if (errorMsg?.includes('own product')) {
        throw new Error('Vous ne pouvez pas acheter votre propre produit');
      } else if (errorMsg?.includes('already sold')) {
        throw new Error('Ce produit a déjà été vendu');
      } else if (errorMsg?.includes('compte de paiement') || errorMsg?.includes('Stripe')) {
        throw new Error('Le vendeur n\'a pas encore configuré son compte de paiement. Contactez-le pour lui demander de configurer Stripe.');
      } else if (errorMsg?.includes('pas encore activé')) {
        throw new Error('Le compte de paiement du vendeur est en cours d\'activation. Réessayez plus tard.');
      }

      throw new Error(errorMsg || 'Erreur lors de la création du paiement');
    }
  }

  /**
   * Calculer le total avec frais de commission
   * Commission Gearted: 10% du prix du produit (pas de la livraison)
   */
  calculateTotal(productPrice: number, shippingCost: number = 0): {
    productPrice: number;
    shippingCost: number;
    commission: number;
    sellerAmount: number;
    total: number;
    commissionPercent: number;
  } {
    const COMMISSION_PERCENT = 10;
    const commission = productPrice * (COMMISSION_PERCENT / 100);
    const sellerAmount = productPrice - commission + shippingCost;
    const total = productPrice + shippingCost;

    return {
      productPrice: parseFloat(productPrice.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      commission: parseFloat(commission.toFixed(2)),
      sellerAmount: parseFloat(sellerAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      commissionPercent: COMMISSION_PERCENT
    };
  }

  /**
   * Afficher une alerte de confirmation avant l'achat
   */
  showPurchaseConfirmation(
    productTitle: string,
    productPrice: number,
    shippingCost: number = 0,
    onConfirm: () => void
  ): void {
    const { total } = this.calculateTotal(productPrice, shippingCost);

    const message = shippingCost > 0
      ? `${productTitle}\n\nPrix : ${productPrice.toFixed(2)} €\nLivraison : ${shippingCost.toFixed(2)} €\nTotal : ${total.toFixed(2)} €`
      : `${productTitle}\n\nPrix : ${productPrice.toFixed(2)} €`;

    Alert.alert(
      'Confirmer l\'achat',
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm }
      ]
    );
  }
}

export default new StripeService();
