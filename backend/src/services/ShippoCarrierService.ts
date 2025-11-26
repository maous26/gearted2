import axios from 'axios';

const SHIPPO_API_URL = 'https://api.goshippo.com';
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';

interface CarrierAccount {
  object_id: string;
  carrier: string;
  account_id: string;
  active: boolean;
  test: boolean;
  parameters?: Record<string, any>;
}

interface ColissimoCredentials {
  accountId: string;
  password: string;
}

interface MondialRelayCredentials {
  enseigne: string;
  privateKey: string;
  brand: string;
  apiLogin: string;
  apiPassword: string;
}

interface ChronopostCredentials {
  accountNumber: string;
  password?: string;
}

export class ShippoCarrierService {
  private static headers = {
    'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
  };

  /**
   * List all carrier accounts
   */
  static async listCarrierAccounts(): Promise<CarrierAccount[]> {
    try {
      const response = await axios.get(
        `${SHIPPO_API_URL}/carrier_accounts/`,
        { headers: this.headers }
      );

      console.log('[ShippoCarrier] Found carrier accounts:', response.data.results?.length || 0);
      return response.data.results || [];
    } catch (error: any) {
      console.error('[ShippoCarrier] List accounts error:', error.response?.data || error.message);
      throw new Error('Failed to list carrier accounts');
    }
  }

  /**
   * Get carrier accounts by carrier name
   */
  static async getCarrierAccountsByName(carrierName: string): Promise<CarrierAccount[]> {
    try {
      const allAccounts = await this.listCarrierAccounts();
      return allAccounts.filter(account =>
        account.carrier.toLowerCase() === carrierName.toLowerCase()
      );
    } catch (error: any) {
      console.error('[ShippoCarrier] Get accounts by name error:', error);
      throw error;
    }
  }

  /**
   * Connect Colissimo carrier account
   * Requires:
   * - 6-digit client number (identifiant)
   * - API password
   *
   * To obtain credentials:
   * 1. Sign a "So Colissimo Flexibilité" contract with La Poste
   * 2. Contact: colissimo.entreprise@laposte.fr
   * 3. Request API access
   */
  static async connectColissimo(
    credentials: ColissimoCredentials,
    isTest: boolean = true
  ): Promise<CarrierAccount> {
    try {
      console.log('[ShippoCarrier] Connecting Colissimo account...', { isTest });

      const response = await axios.post(
        `${SHIPPO_API_URL}/carrier_accounts/`,
        {
          carrier: 'colissimo',
          account_id: credentials.accountId,
          parameters: {
            password: credentials.password
          },
          active: true,
          test: isTest
        },
        { headers: this.headers }
      );

      console.log('[ShippoCarrier] Colissimo connected successfully:', response.data.object_id);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoCarrier] Connect Colissimo error:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.messages?.[0]?.text || error.message;
      throw new Error(`Failed to connect Colissimo: ${errorMessage}`);
    }
  }

  /**
   * Connect Mondial Relay carrier account
   * NOTE: Deprecated - We now use MondialRelay API directly via SOAP, not via Shippo
   * See MondialRelayService for the new implementation
   */
  static async connectMondialRelay(
    credentials: MondialRelayCredentials,
    isTest: boolean = true
  ): Promise<CarrierAccount> {
    throw new Error('Mondial Relay is now integrated directly via SOAP API. Use MondialRelayService instead.');
  }

  /**
   * Connect Chronopost carrier account
   * Note: Shippo has default Chronopost account, but connecting your own gives better rates
   *
   * Requires:
   * - Chronopost account number
   * - Password (optional, depends on contract)
   *
   * To obtain credentials:
   * 1. Sign a Chronopost business contract
   * 2. Contact Chronopost customer service
   * 3. Request API access
   */
  static async connectChronopost(
    credentials: ChronopostCredentials,
    isTest: boolean = true
  ): Promise<CarrierAccount> {
    try {
      console.log('[ShippoCarrier] Connecting Chronopost account...', { isTest });

      const requestBody: any = {
        carrier: 'chronopost',
        account_id: credentials.accountNumber,
        active: true,
        test: isTest
      };

      if (credentials.password) {
        requestBody.parameters = {
          password: credentials.password
        };
      }

      const response = await axios.post(
        `${SHIPPO_API_URL}/carrier_accounts/`,
        requestBody,
        { headers: this.headers }
      );

      console.log('[ShippoCarrier] Chronopost connected successfully:', response.data.object_id);
      return response.data;
    } catch (error: any) {
      console.error('[ShippoCarrier] Connect Chronopost error:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.messages?.[0]?.text || error.message;
      throw new Error(`Failed to connect Chronopost: ${errorMessage}`);
    }
  }

  /**
   * Update carrier account (activate/deactivate, update credentials)
   */
  static async updateCarrierAccount(
    carrierAccountId: string,
    updates: Partial<{
      active: boolean;
      parameters: Record<string, any>;
    }>
  ): Promise<CarrierAccount> {
    try {
      console.log('[ShippoCarrier] Updating carrier account:', carrierAccountId);

      const response = await axios.put(
        `${SHIPPO_API_URL}/carrier_accounts/${carrierAccountId}`,
        updates,
        { headers: this.headers }
      );

      console.log('[ShippoCarrier] Carrier account updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('[ShippoCarrier] Update account error:', error.response?.data || error.message);
      throw new Error('Failed to update carrier account');
    }
  }

  /**
   * Delete/disconnect carrier account
   */
  static async deleteCarrierAccount(carrierAccountId: string): Promise<void> {
    try {
      console.log('[ShippoCarrier] Deleting carrier account:', carrierAccountId);

      await axios.delete(
        `${SHIPPO_API_URL}/carrier_accounts/${carrierAccountId}`,
        { headers: this.headers }
      );

      console.log('[ShippoCarrier] Carrier account deleted successfully');
    } catch (error: any) {
      console.error('[ShippoCarrier] Delete account error:', error.response?.data || error.message);
      throw new Error('Failed to delete carrier account');
    }
  }

  /**
   * Setup all French carriers from environment variables
   * This is useful for initial setup or migrations
   */
  static async setupAllCarriers(isTest: boolean = true): Promise<{
    colissimo?: CarrierAccount | Error;
    mondialRelay?: CarrierAccount | Error;
    chronopost?: CarrierAccount | Error;
  }> {
    const results: any = {};

    // Try Colissimo
    if (process.env.COLISSIMO_ACCOUNT_ID && process.env.COLISSIMO_PASSWORD) {
      try {
        results.colissimo = await this.connectColissimo(
          {
            accountId: process.env.COLISSIMO_ACCOUNT_ID,
            password: process.env.COLISSIMO_PASSWORD
          },
          isTest
        );
      } catch (error: any) {
        results.colissimo = error;
        console.warn('[ShippoCarrier] Colissimo setup failed:', error.message);
      }
    } else {
      console.log('[ShippoCarrier] Colissimo credentials not found in .env');
    }

    // Mondial Relay - Deprecated (now using direct SOAP API via MondialRelayService)
    console.log('[ShippoCarrier] Mondial Relay is now integrated directly via SOAP API, skipping Shippo setup');

    // Try Chronopost
    if (process.env.CHRONOPOST_ACCOUNT_NUMBER) {
      try {
        results.chronopost = await this.connectChronopost(
          {
            accountNumber: process.env.CHRONOPOST_ACCOUNT_NUMBER,
            password: process.env.CHRONOPOST_PASSWORD
          },
          isTest
        );
      } catch (error: any) {
        results.chronopost = error;
        console.warn('[ShippoCarrier] Chronopost setup failed:', error.message);
      }
    } else {
      console.log('[ShippoCarrier] Chronopost credentials not found in .env');
    }

    return results;
  }

  /**
   * Get summary of available carriers and their status
   */
  static async getCarriersSummary(): Promise<{
    total: number;
    byCarrier: Record<string, { count: number; active: number; test: number }>;
    accounts: CarrierAccount[];
  }> {
    try {
      const accounts = await this.listCarrierAccounts();

      const byCarrier: Record<string, { count: number; active: number; test: number }> = {};

      accounts.forEach(account => {
        if (!byCarrier[account.carrier]) {
          byCarrier[account.carrier] = { count: 0, active: 0, test: 0 };
        }
        byCarrier[account.carrier].count++;
        if (account.active) byCarrier[account.carrier].active++;
        if (account.test) byCarrier[account.carrier].test++;
      });

      return {
        total: accounts.length,
        byCarrier,
        accounts
      };
    } catch (error: any) {
      console.error('[ShippoCarrier] Get summary error:', error);
      throw error;
    }
  }
}
