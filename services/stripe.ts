import { Alert } from 'react-native';
import api from './api';

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
  productPrice: number;
  buyerFee: number;
  totalCharge: number;
  sellerFee: number;
  sellerAmount: number;
  platformFee: number;
}

export interface PremiumOptions {
  wantExpertise: boolean;
  wantInsurance: boolean;
  expertisePrice: number;
  insurancePrice: number;
  grandTotal: number;
  // Livraison (payée par l'acheteur)
  shippingRateId?: string | null;
  shippingCost?: number;
  shippingProvider?: string | null;
}

export interface StripePublicKeyResponse {
  publishableKey: string;
}

/**
 * Service pour gérer les paiements Stripe
 */
class StripeService {
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
   */
  async createPaymentIntent(
    productId: string,
    amount: number,
    currency: string = 'eur',
    premiumOptions?: PremiumOptions
  ): Promise<PaymentIntentResponse> {
    try {
      const response = await api.post<PaymentIntentResponse>('/api/stripe/create-payment-intent', {
        productId,
        amount,
        currency,
        ...(premiumOptions && {
          wantExpertise: premiumOptions.wantExpertise,
          wantInsurance: premiumOptions.wantInsurance,
          expertisePrice: premiumOptions.expertisePrice,
          insurancePrice: premiumOptions.insurancePrice,
          grandTotal: premiumOptions.grandTotal,
          // Livraison
          shippingRateId: premiumOptions.shippingRateId,
          shippingCost: premiumOptions.shippingCost,
          shippingProvider: premiumOptions.shippingProvider,
        })
      });

      if (!response.success) {
        throw new Error('Échec de la création du paiement');
      }

      return response;
    } catch (error: any) {
      console.error('[Stripe] Failed to create payment intent:', error);

      // Messages d'erreur personnalisés
      if (error.response?.status === 404) {
        throw new Error('Produit introuvable');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error;
        if (errorMsg?.includes('own product')) {
          throw new Error('Vous ne pouvez pas acheter votre propre produit');
        } else if (errorMsg?.includes('already sold')) {
          throw new Error('Ce produit a déjà été vendu');
        }
      } else if (error.response?.data?.error?.includes('Stripe account')) {
        throw new Error('Le vendeur n\'a pas configuré son compte de paiement');
      }

      throw new Error(error.response?.data?.error || 'Erreur lors de la création du paiement');
    }
  }

  /**
   * Calculer le total avec frais de service
   * Note: Pour un calcul précis, utiliser calculateTotalWithFeesFromApi()
   * Cette méthode utilise les valeurs par défaut (5%) pour un affichage rapide
   */
  calculateTotalWithFees(productPrice: number, buyerFeePercent: number = 5): {
    productPrice: number;
    buyerFee: number;
    total: number;
  } {
    const buyerFee = productPrice * (buyerFeePercent / 100);
    const total = productPrice + buyerFee;

    return {
      productPrice: parseFloat(productPrice.toFixed(2)),
      buyerFee: parseFloat(buyerFee.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Calculer le total en récupérant les vrais taux depuis l'API
   */
  async calculateTotalWithFeesFromApi(productPrice: number): Promise<{
    productPrice: number;
    buyerFee: number;
    total: number;
    buyerFeePercent: number;
  }> {
    try {
      const response: any = await api.get('/api/settings/commissions');
      const settings = response.data?.settings || { buyerEnabled: true, buyerFeePercent: 5 };
      
      const buyerFeePercent = settings.buyerEnabled ? (settings.buyerFeePercent || 5) : 0;
      const buyerFee = productPrice * (buyerFeePercent / 100);
      const total = productPrice + buyerFee;

      return {
        productPrice: parseFloat(productPrice.toFixed(2)),
        buyerFee: parseFloat(buyerFee.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        buyerFeePercent
      };
    } catch (error) {
      // Fallback to default
      return {
        ...this.calculateTotalWithFees(productPrice),
        buyerFeePercent: 5
      };
    }
  }

  /**
   * Afficher une alerte de confirmation avant l'achat
   */
  showPurchaseConfirmation(
    productTitle: string,
    productPrice: number,
    onConfirm: () => void
  ): void {
    const { productPrice: price, buyerFee, total } = this.calculateTotalWithFees(productPrice);

    Alert.alert(
      'Confirmer l\'achat',
      `${productTitle}\n\nPrix : ${price.toFixed(2)} €\nFrais de service : ${buyerFee.toFixed(2)} €\nTotal : ${total.toFixed(2)} €`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm }
      ]
    );
  }
}

export default new StripeService();
