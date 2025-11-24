import api from './api';

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippingRate {
  rateId: string;
  provider: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
}

export interface ShippingLabel {
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: string;
}

/**
 * Service pour gérer les expéditions
 */
class ShippingService {
  /**
   * Ajouter une adresse de livraison à une transaction
   */
  async addShippingAddress(transactionId: string, address: ShippingAddress) {
    try {
      const response = await api.post(`/api/shipping/address/${transactionId}`, address);
      return response;
    } catch (error: any) {
      console.error('[Shipping] Failed to add shipping address:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'ajout de l\'adresse');
    }
  }

  /**
   * Obtenir les tarifs de livraison (vendeur)
   */
  async getShippingRates(
    transactionId: string,
    dimensions: { length: number; width: number; height: number; weight: number }
  ): Promise<{ shipmentId: string; rates: ShippingRate[] }> {
    try {
      const response = await api.post<{ success: boolean; shipmentId: string; rates: ShippingRate[] }>(
        `/api/shipping/rates/${transactionId}`,
        dimensions
      );
      return {
        shipmentId: response.shipmentId,
        rates: response.rates
      };
    } catch (error: any) {
      console.error('[Shipping] Failed to get shipping rates:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des tarifs');
    }
  }

  /**
   * Acheter une étiquette de livraison (vendeur)
   */
  async purchaseLabel(transactionId: string, rateId: string): Promise<ShippingLabel> {
    try {
      const response = await api.post<{ success: boolean; label: ShippingLabel }>(
        `/api/shipping/label/${transactionId}`,
        { rateId }
      );
      return response.label;
    } catch (error: any) {
      console.error('[Shipping] Failed to purchase label:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'achat de l\'étiquette');
    }
  }

  /**
   * Obtenir les informations de suivi
   */
  async getTracking(transactionId: string) {
    try {
      const response = await api.get(`/api/shipping/tracking/${transactionId}`);
      return response;
    } catch (error: any) {
      console.error('[Shipping] Failed to get tracking:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du suivi');
    }
  }

  /**
   * Obtenir toutes les expéditions en attente (vendeur)
   */
  async getPendingShipments() {
    try {
      const response = await api.get('/api/shipping/pending');
      return response;
    } catch (error: any) {
      console.error('[Shipping] Failed to get pending shipments:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des expéditions');
    }
  }
}

export default new ShippingService();
