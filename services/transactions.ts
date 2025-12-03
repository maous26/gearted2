import api from './api';

export interface Transaction {
  id: string;
  productId: string;
  buyerId: string;
  amount: number;
  currency: string;
  platformFee: number;
  sellerAmount: number;
  paymentIntentId: string;
  status: string;
  trackingNumber?: string;
  shippingAddress?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    parcelDimensionsId?: string; // Lien vers dimensions du colis
    parcelDimensions?: {
      id: string;
      length: number;
      width: number;
      height: number;
      weight: number;
    };
    seller?: {
      id: string;
      username: string;
      email: string;
    };
  };
  buyer?: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * Service pour gérer les transactions (ventes et achats)
 */
class TransactionService {
  /**
   * Récupérer toutes mes ventes (en tant que vendeur)
   */
  async getMySales(): Promise<Transaction[]> {
    try {
      const response = await api.get<{ success: boolean; sales: Transaction[] }>(
        '/api/transactions/my-sales'
      );
      return response.sales || [];
    } catch (error: any) {
      console.error('[Transactions] Failed to get sales:', error);
      const errorMessage = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.message || error.message || 'Erreur lors de la récupération des ventes';
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupérer tous mes achats (en tant qu'acheteur)
   */
  async getMyPurchases(): Promise<Transaction[]> {
    try {
      const response = await api.get<{ success: boolean; purchases: Transaction[] }>(
        '/api/transactions/my-purchases'
      );
      return response.purchases || [];
    } catch (error: any) {
      console.error('[Transactions] Failed to get purchases:', error);
      const errorMessage = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.message || error.message || 'Erreur lors de la récupération des achats';
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupérer les détails d'une transaction
   */
  async getTransactionDetails(transactionId: string): Promise<Transaction> {
    try {
      const response = await api.get<{ success: boolean; transaction: Transaction }>(
        `/api/transactions/${transactionId}`
      );
      return response.transaction;
    } catch (error: any) {
      console.error('[Transactions] Failed to get transaction details:', error);
      const errorMessage = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.message || error.message || 'Erreur lors de la récupération de la transaction';
      throw new Error(errorMessage);
    }
  }

  /**
   * Annuler une transaction (avant génération d'étiquette)
   * - Remboursement automatique
   * - Le produit est remis en vente
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    refundStatus: 'completed' | 'manual_required';
    cancelledBy: 'buyer' | 'seller';
    productId?: string;
    productTitle?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        refundStatus: 'completed' | 'manual_required';
        cancelledBy: 'buyer' | 'seller';
        productId?: string;
        productTitle?: string;
      }>(`/api/transactions/${transactionId}/cancel`, { reason });
      
      return response;
    } catch (error: any) {
      console.error('[Transactions] Failed to cancel transaction:', error);
      const errorMessage = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.response?.data?.message || error.message || 'Erreur lors de l\'annulation de la transaction';
      throw new Error(errorMessage);
    }
  }
}

export default new TransactionService();
