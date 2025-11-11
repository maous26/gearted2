import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load Shippo configuration
const configPath = path.join(__dirname, '../../shippo-config.json');
const shippoConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  company?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  distance_unit?: 'cm' | 'in' | 'm' | 'ft' | 'mm' | 'yd';
  mass_unit?: 'kg' | 'lb' | 'g' | 'oz';
}

interface ShippingRate {
  object_id: string;
  amount: string;
  currency: string;
  carrier: string;
  carrier_account: string;
  service_level: {
    name: string;
    token: string;
    terms?: string;
  };
  estimated_days: number;
  duration_terms?: string;
  trackable: boolean;
  insurance_amount?: string;
  attributes: string[];
}

interface Transaction {
  object_id: string;
  status: string;
  label_url: string;
  tracking_number: string;
  tracking_url_provider: string;
  eta?: string;
  metadata?: string;
}

class ShippoService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string = 'https://api.goshippo.com';

  constructor() {
    this.apiKey = process.env.SHIPPO_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[ShippoService] SHIPPO_API_KEY not set. Service will not work properly.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `ShippoToken ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Validate and create an address in Shippo
   */
  async createAddress(address: Address): Promise<any> {
    try {
      const response = await this.client.post('/addresses/', address);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error creating address:', error.response?.data || error.message);
      throw new Error('Failed to create address');
    }
  }

  /**
   * Create a parcel object
   */
  async createParcel(parcel: Parcel): Promise<any> {
    try {
      const parcelData = {
        ...parcel,
        distance_unit: parcel.distance_unit || shippoConfig.defaultDistanceUnit,
        mass_unit: parcel.mass_unit || shippoConfig.defaultWeightUnit,
      };

      const response = await this.client.post('/parcels/', parcelData);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error creating parcel:', error.response?.data || error.message);
      throw new Error('Failed to create parcel');
    }
  }

  /**
   * Create a shipment and get rates
   */
  async createShipment(
    fromAddress: Address | string,
    toAddress: Address | string,
    parcel: Parcel | string,
    options?: {
      async?: boolean;
      extra?: any;
    }
  ): Promise<any> {
    try {
      const shipmentData: any = {
        address_from: fromAddress,
        address_to: toAddress,
        parcels: [parcel],
        async: options?.async || false,
      };

      if (options?.extra) {
        shipmentData.extra = options.extra;
      }

      const response = await this.client.post('/shipments/', shipmentData);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error creating shipment:', error.response?.data || error.message);
      throw new Error('Failed to create shipment');
    }
  }

  /**
   * Get shipping rates for a shipment
   */
  async getRates(shipmentObjectId: string): Promise<ShippingRate[]> {
    try {
      const response = await this.client.get(`/shipments/${shipmentObjectId}`);
      const shipment = response.data;

      if (!shipment.rates || shipment.rates.length === 0) {
        throw new Error('No rates available for this shipment');
      }

      return shipment.rates;
    } catch (error: any) {
      console.error('[ShippoService] Error getting rates:', error.response?.data || error.message);
      throw new Error('Failed to get shipping rates');
    }
  }

  /**
   * Filter rates by zone (France vs Europe)
   */
  filterRatesByZone(rates: ShippingRate[], toCountry: string): ShippingRate[] {
    const isFrance = toCountry.toUpperCase() === 'FR';
    const franceCarriers = shippoConfig.carriers.france.map((c: any) => c.id);
    const europeCarriers = shippoConfig.carriers.europe.map((c: any) => c.id);

    return rates.filter((rate) => {
      const carrierLower = rate.carrier.toLowerCase();
      if (isFrance) {
        return franceCarriers.some((fc: string) => carrierLower.includes(fc));
      } else {
        // For Europe, include both EU carriers and some FR carriers that ship internationally
        return europeCarriers.some((ec: string) => carrierLower.includes(ec)) ||
               carrierLower.includes('colissimo_international');
      }
    });
  }

  /**
   * Select best rate based on criteria (cheapest, fastest, etc.)
   */
  selectBestRate(rates: ShippingRate[], criteria: 'cheapest' | 'fastest' = 'cheapest'): ShippingRate | null {
    if (!rates || rates.length === 0) return null;

    if (criteria === 'cheapest') {
      return rates.reduce((prev, curr) => {
        return parseFloat(curr.amount) < parseFloat(prev.amount) ? curr : prev;
      });
    } else if (criteria === 'fastest') {
      return rates.reduce((prev, curr) => {
        return (curr.estimated_days || 999) < (prev.estimated_days || 999) ? curr : prev;
      });
    }

    return rates[0];
  }

  /**
   * Create a transaction (purchase a label)
   */
  async createTransaction(
    rateObjectId: string,
    labelFileType: 'PNG' | 'PDF' | 'PDF_4x6' | 'ZPLII' = 'PDF',
    async: boolean = false
  ): Promise<Transaction> {
    try {
      const transactionData = {
        rate: rateObjectId,
        label_file_type: labelFileType,
        async,
      };

      const response = await this.client.post('/transactions/', transactionData);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error creating transaction:', error.response?.data || error.message);
      throw new Error('Failed to create shipping label');
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(carrier: string, trackingNumber: string): Promise<any> {
    try {
      const response = await this.client.get(`/tracks/${carrier}/${trackingNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error tracking shipment:', error.response?.data || error.message);
      throw new Error('Failed to track shipment');
    }
  }

  /**
   * Register a tracking webhook
   */
  async registerTrackingWebhook(carrier: string, trackingNumber: string, metadata?: string): Promise<any> {
    try {
      const trackData: any = {
        carrier,
        tracking_number: trackingNumber,
      };

      if (metadata) {
        trackData.metadata = metadata;
      }

      const response = await this.client.post('/tracks/', trackData);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoService] Error registering tracking webhook:', error.response?.data || error.message);
      throw new Error('Failed to register tracking webhook');
    }
  }

  /**
   * Get parcel template from config by weapon type
   */
  getParcelTemplate(weaponType?: string, size: 'small' | 'medium' | 'large' = 'medium'): Parcel | null {
    if (weaponType) {
      const template = shippoConfig.parcelTemplates.airsoft_replicas.find(
        (t: any) => t.weaponTypes && t.weaponTypes.includes(weaponType)
      );
      if (template) {
        return {
          length: template.length,
          width: template.width,
          height: template.height,
          weight: template.weight,
        };
      }
    }

    // Fallback to accessory templates
    const accessoryTemplates: any = {
      small: shippoConfig.parcelTemplates.accessories[0],
      medium: shippoConfig.parcelTemplates.accessories[1],
      large: shippoConfig.parcelTemplates.accessories[2],
    };

    const template = accessoryTemplates[size];
    if (template) {
      return {
        length: template.length,
        width: template.width,
        height: template.height,
        weight: template.weight,
      };
    }

    return null;
  }

  /**
   * Calculate all available rates for a shipment
   */
  async calculateRates(
    fromAddress: Address,
    toAddress: Address,
    parcel: Parcel,
    options?: {
      filterByZone?: boolean;
      selectBest?: 'cheapest' | 'fastest';
    }
  ): Promise<{ shipmentId: string; rates: ShippingRate[]; selectedRate?: ShippingRate }> {
    try {
      // Create shipment
      const shipment = await this.createShipment(fromAddress, toAddress, parcel);

      // Get rates
      let rates = shipment.rates || [];

      // Filter by zone if requested
      if (options?.filterByZone) {
        rates = this.filterRatesByZone(rates, toAddress.country);
      }

      // Select best rate if requested
      let selectedRate: ShippingRate | undefined;
      if (options?.selectBest) {
        selectedRate = this.selectBestRate(rates, options.selectBest) || undefined;
      }

      return {
        shipmentId: shipment.object_id,
        rates,
        selectedRate,
      };
    } catch (error: any) {
      console.error('[ShippoService] Error calculating rates:', error.message);
      throw error;
    }
  }

  /**
   * Complete shipping flow: calculate rates + create label
   */
  async createShippingLabel(
    fromAddress: Address,
    toAddress: Address,
    parcel: Parcel,
    rateObjectId?: string,
    options?: {
      selectBest?: 'cheapest' | 'fastest';
      labelFormat?: 'PNG' | 'PDF' | 'PDF_4x6' | 'ZPLII';
    }
  ): Promise<{ transaction: Transaction; rate: ShippingRate }> {
    try {
      let rate: ShippingRate;

      if (rateObjectId) {
        // Use provided rate
        const ratesResponse = await this.getRates(rateObjectId);
        rate = ratesResponse.find((r) => r.object_id === rateObjectId) || ratesResponse[0];
      } else {
        // Calculate rates and select best
        const { rates } = await this.calculateRates(fromAddress, toAddress, parcel, {
          filterByZone: true,
          selectBest: options?.selectBest || 'cheapest',
        });

        if (!rates || rates.length === 0) {
          throw new Error('No shipping rates available');
        }

        rate = this.selectBestRate(rates, options?.selectBest || 'cheapest')!;
      }

      // Create transaction (purchase label)
      const transaction = await this.createTransaction(
        rate.object_id,
        options?.labelFormat || 'PDF'
      );

      return { transaction, rate };
    } catch (error: any) {
      console.error('[ShippoService] Error creating shipping label:', error.message);
      throw error;
    }
  }

  /**
   * Export shipments to CSV for bulk import
   */
  generateShipmentCSV(shipments: any[]): string {
    const headers = shippoConfig.csvExport.fields;
    const rows = shipments.map((shipment) => {
      return [
        shipment.orderNumber,
        new Date(shipment.orderDate).toLocaleDateString('en-US'),
        shipment.recipientName,
        shipment.company || '',
        shipment.email || '',
        shipment.phone || '',
        shipment.street1,
        '', // Street Number (not separated in our data)
        shipment.street2 || '',
        shipment.city,
        shipment.state || '',
        shipment.zip,
        shipment.country,
        shipment.itemTitle,
        shipment.sku || '',
        shipment.quantity || 1,
        shipment.itemWeight,
        shipment.itemWeightUnit || 'kg',
        shipment.itemPrice,
        shipment.itemCurrency || 'EUR',
        shipment.orderWeight,
        shipment.orderWeightUnit || 'kg',
        shipment.orderAmount,
        shipment.orderCurrency || 'EUR',
      ].map((field) => `"${field}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export default new ShippoService();

