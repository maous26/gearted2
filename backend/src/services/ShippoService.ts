import axios from 'axios';

const SHIPPO_API_URL = 'https://api.goshippo.com';
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';

interface ShippoAddress {
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

interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: 'cm' | 'in';
  weight: string;
  mass_unit: 'kg' | 'lb';
}

interface ShippoRate {
  object_id: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  amount: string;
  currency: string;
  estimated_days: number;
}

interface ShippoShipment {
  object_id: string;
  rates: ShippoRate[];
}

interface ShippoTransaction {
  object_id: string;
  status: string;
  label_url: string;
  tracking_number: string;
  tracking_url_provider: string;
  eta: string;
}

export class ShippoService {
  private static headers = {
    'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
  };

  /**
   * Créer une adresse Shippo
   */
  static async createAddress(address: ShippoAddress) {
    try {
      const response = await axios.post(
        `${SHIPPO_API_URL}/addresses`,
        address,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Shippo] Create address error:', error.response?.data || error.message);
      throw new Error('Failed to create shipping address');
    }
  }

  /**
   * Créer un colis (parcel)
   */
  static async createParcel(parcel: ShippoParcel) {
    try {
      const response = await axios.post(
        `${SHIPPO_API_URL}/parcels`,
        parcel,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Shippo] Create parcel error:', error.response?.data || error.message);
      throw new Error('Failed to create parcel');
    }
  }

  /**
   * Créer un envoi (shipment) et obtenir les tarifs
   */
  static async createShipment(
    fromAddress: ShippoAddress,
    toAddress: ShippoAddress,
    parcel: ShippoParcel
  ): Promise<ShippoShipment> {
    try {
      const response = await axios.post(
        `${SHIPPO_API_URL}/shipments`,
        {
          address_from: fromAddress,
          address_to: toAddress,
          parcels: [parcel],
          async: false, // Synchronous pour obtenir les tarifs immédiatement
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Shippo] Create shipment error:', error.response?.data || error.message);
      throw new Error('Failed to create shipment');
    }
  }

  /**
   * Acheter une étiquette d'expédition
   */
  static async purchaseLabel(rateId: string): Promise<ShippoTransaction> {
    try {
      const response = await axios.post(
        `${SHIPPO_API_URL}/transactions`,
        {
          rate: rateId,
          label_file_type: 'PDF',
          async: false,
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Shippo] Purchase label error:', error.response?.data || error.message);
      throw new Error('Failed to purchase shipping label');
    }
  }

  /**
   * Obtenir les informations de suivi
   */
  static async getTracking(carrier: string, trackingNumber: string) {
    try {
      const response = await axios.get(
        `${SHIPPO_API_URL}/tracks/${carrier}/${trackingNumber}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('[Shippo] Get tracking error:', error.response?.data || error.message);
      throw new Error('Failed to get tracking information');
    }
  }

  /**
   * Workflow complet : créer un envoi et obtenir les tarifs
   */
  static async getShippingRates(
    fromAddress: ShippoAddress,
    toAddress: ShippoAddress,
    parcel: ShippoParcel
  ) {
    const shipment = await this.createShipment(fromAddress, toAddress, parcel);

    // Trier les tarifs par prix
    const sortedRates = shipment.rates
      .filter((rate: ShippoRate) => rate.provider !== 'USPS') // Exclure USPS si pas en US
      .sort((a: ShippoRate, b: ShippoRate) => parseFloat(a.amount) - parseFloat(b.amount));

    return {
      shipmentId: shipment.object_id,
      rates: sortedRates.map((rate: ShippoRate) => ({
        rateId: rate.object_id,
        provider: rate.provider,
        serviceName: rate.servicelevel.name,
        price: parseFloat(rate.amount),
        currency: rate.currency,
        estimatedDays: rate.estimated_days,
      })),
    };
  }

  /**
   * Acheter l'étiquette et retourner les infos de suivi
   */
  static async buyShippingLabel(rateId: string) {
    const transaction = await this.purchaseLabel(rateId);

    console.log('[Shippo] Purchase transaction response:', JSON.stringify(transaction, null, 2));

    if (transaction.status !== 'SUCCESS') {
      const errorMessages = (transaction as any).messages || [];
      const errorDetails = errorMessages.map((m: any) => m.text).join(', ');
      console.error('[Shippo] Transaction failed with status:', transaction.status);
      console.error('[Shippo] Error details:', errorDetails);
      throw new Error('Failed to purchase shipping label: ' + (errorDetails || transaction.status));
    }

    return {
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      estimatedDelivery: transaction.eta,
    };
  }
}
