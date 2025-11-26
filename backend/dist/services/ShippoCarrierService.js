"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippoCarrierService = void 0;
const axios_1 = __importDefault(require("axios"));
const SHIPPO_API_URL = 'https://api.goshippo.com';
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';
class ShippoCarrierService {
    static async listCarrierAccounts() {
        try {
            const response = await axios_1.default.get(`${SHIPPO_API_URL}/carrier_accounts/`, { headers: this.headers });
            console.log('[ShippoCarrier] Found carrier accounts:', response.data.results?.length || 0);
            return response.data.results || [];
        }
        catch (error) {
            console.error('[ShippoCarrier] List accounts error:', error.response?.data || error.message);
            throw new Error('Failed to list carrier accounts');
        }
    }
    static async getCarrierAccountsByName(carrierName) {
        try {
            const allAccounts = await this.listCarrierAccounts();
            return allAccounts.filter(account => account.carrier.toLowerCase() === carrierName.toLowerCase());
        }
        catch (error) {
            console.error('[ShippoCarrier] Get accounts by name error:', error);
            throw error;
        }
    }
    static async connectColissimo(credentials, isTest = true) {
        try {
            console.log('[ShippoCarrier] Connecting Colissimo account...', { isTest });
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/carrier_accounts/`, {
                carrier: 'colissimo',
                account_id: credentials.accountId,
                parameters: {
                    password: credentials.password
                },
                active: true,
                test: isTest
            }, { headers: this.headers });
            console.log('[ShippoCarrier] Colissimo connected successfully:', response.data.object_id);
            return response.data;
        }
        catch (error) {
            console.error('[ShippoCarrier] Connect Colissimo error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.messages?.[0]?.text || error.message;
            throw new Error(`Failed to connect Colissimo: ${errorMessage}`);
        }
    }
    static async connectMondialRelay(credentials, isTest = true) {
        throw new Error('Mondial Relay is now integrated directly via SOAP API. Use MondialRelayService instead.');
    }
    static async connectChronopost(credentials, isTest = true) {
        try {
            console.log('[ShippoCarrier] Connecting Chronopost account...', { isTest });
            const requestBody = {
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
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/carrier_accounts/`, requestBody, { headers: this.headers });
            console.log('[ShippoCarrier] Chronopost connected successfully:', response.data.object_id);
            return response.data;
        }
        catch (error) {
            console.error('[ShippoCarrier] Connect Chronopost error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.messages?.[0]?.text || error.message;
            throw new Error(`Failed to connect Chronopost: ${errorMessage}`);
        }
    }
    static async updateCarrierAccount(carrierAccountId, updates) {
        try {
            console.log('[ShippoCarrier] Updating carrier account:', carrierAccountId);
            const response = await axios_1.default.put(`${SHIPPO_API_URL}/carrier_accounts/${carrierAccountId}`, updates, { headers: this.headers });
            console.log('[ShippoCarrier] Carrier account updated successfully');
            return response.data;
        }
        catch (error) {
            console.error('[ShippoCarrier] Update account error:', error.response?.data || error.message);
            throw new Error('Failed to update carrier account');
        }
    }
    static async deleteCarrierAccount(carrierAccountId) {
        try {
            console.log('[ShippoCarrier] Deleting carrier account:', carrierAccountId);
            await axios_1.default.delete(`${SHIPPO_API_URL}/carrier_accounts/${carrierAccountId}`, { headers: this.headers });
            console.log('[ShippoCarrier] Carrier account deleted successfully');
        }
        catch (error) {
            console.error('[ShippoCarrier] Delete account error:', error.response?.data || error.message);
            throw new Error('Failed to delete carrier account');
        }
    }
    static async setupAllCarriers(isTest = true) {
        const results = {};
        if (process.env.COLISSIMO_ACCOUNT_ID && process.env.COLISSIMO_PASSWORD) {
            try {
                results.colissimo = await this.connectColissimo({
                    accountId: process.env.COLISSIMO_ACCOUNT_ID,
                    password: process.env.COLISSIMO_PASSWORD
                }, isTest);
            }
            catch (error) {
                results.colissimo = error;
                console.warn('[ShippoCarrier] Colissimo setup failed:', error.message);
            }
        }
        else {
            console.log('[ShippoCarrier] Colissimo credentials not found in .env');
        }
        console.log('[ShippoCarrier] Mondial Relay is now integrated directly via SOAP API, skipping Shippo setup');
        if (process.env.CHRONOPOST_ACCOUNT_NUMBER) {
            try {
                results.chronopost = await this.connectChronopost({
                    accountNumber: process.env.CHRONOPOST_ACCOUNT_NUMBER,
                    password: process.env.CHRONOPOST_PASSWORD
                }, isTest);
            }
            catch (error) {
                results.chronopost = error;
                console.warn('[ShippoCarrier] Chronopost setup failed:', error.message);
            }
        }
        else {
            console.log('[ShippoCarrier] Chronopost credentials not found in .env');
        }
        return results;
    }
    static async getCarriersSummary() {
        try {
            const accounts = await this.listCarrierAccounts();
            const byCarrier = {};
            accounts.forEach(account => {
                if (!byCarrier[account.carrier]) {
                    byCarrier[account.carrier] = { count: 0, active: 0, test: 0 };
                }
                byCarrier[account.carrier].count++;
                if (account.active)
                    byCarrier[account.carrier].active++;
                if (account.test)
                    byCarrier[account.carrier].test++;
            });
            return {
                total: accounts.length,
                byCarrier,
                accounts
            };
        }
        catch (error) {
            console.error('[ShippoCarrier] Get summary error:', error);
            throw error;
        }
    }
}
exports.ShippoCarrierService = ShippoCarrierService;
ShippoCarrierService.headers = {
    'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
};
//# sourceMappingURL=ShippoCarrierService.js.map