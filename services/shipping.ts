import api from './api';

export interface ShippingAddress {
  id?: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
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

  /**
   * RGPD - Supprimer l'adresse de livraison d'une transaction
   */
  async deleteShippingAddress(transactionId: string) {
    try {
      const response = await api.delete(`/api/shipping/address/${transactionId}`);
      return response;
    } catch (error: any) {
      console.error('[Shipping] Failed to delete shipping address:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression de l\'adresse');
    }
  }

  /**
   * RGPD - Obtenir toutes les adresses de livraison de l'utilisateur
   */
  async getMyShippingAddresses() {
    try {
      const response = await api.get('/api/shipping/my-addresses');
      return response;
    } catch (error: any) {
      console.error('[Shipping] Failed to get my addresses:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des adresses');
    }
  }

  /**
   * Récupérer les adresses sauvegardées de l'utilisateur
   */
  async getSavedAddresses(): Promise<ShippingAddress[]> {
    try {
      const response = await api.get<{ success: boolean; addresses: ShippingAddress[] }>('/api/shipping/addresses');
      return response.addresses || [];
    } catch (error: any) {
      console.error('[Shipping] Failed to get saved addresses:', error);
      return [];
    }
  }

  /**
   * Récupérer l'adresse par défaut de l'utilisateur
   */
  async getDefaultAddress(): Promise<ShippingAddress | null> {
    try {
      const addresses = await this.getSavedAddresses();
      return addresses.find(a => a.isDefault) || addresses[0] || null;
    } catch (error: any) {
      console.error('[Shipping] Failed to get default address:', error);
      return null;
    }
  }

  /**
   * Créer ou mettre à jour une adresse sauvegardée
   * Note: On utilise l'endpoint de transaction avec saveAddress=true et un ID fictif
   * pour créer une nouvelle adresse. Pour une vraie implémentation, il faudrait
   * un endpoint dédié POST /api/shipping/addresses
   */
  async saveAddress(address: ShippingAddress, setAsDefault: boolean = true): Promise<ShippingAddress> {
    try {
      // Si l'adresse a un ID, on peut la mettre à jour ou la définir par défaut
      if (address.id && setAsDefault) {
        await api.put(`/api/shipping/addresses/${address.id}/default`, {});
      }

      // Pour créer une nouvelle adresse, on utilise un endpoint direct
      const response = await api.post<{ success: boolean; address: ShippingAddress }>('/api/shipping/addresses', {
        ...address,
        isDefault: setAsDefault
      });

      return response.address;
    } catch (error: any) {
      console.error('[Shipping] Failed to save address:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la sauvegarde de l\'adresse');
    }
  }

  /**
   * Définir une adresse comme adresse par défaut
   */
  async setDefaultAddress(addressId: string): Promise<void> {
    try {
      await api.put(`/api/shipping/addresses/${addressId}/default`, {});
    } catch (error: any) {
      console.error('[Shipping] Failed to set default address:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Supprimer une adresse sauvegardée
   */
  async deleteSavedAddress(addressId: string): Promise<void> {
    try {
      await api.delete(`/api/shipping/addresses/${addressId}`);
    } catch (error: any) {
      console.error('[Shipping] Failed to delete address:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  }
}

export default new ShippingService();
