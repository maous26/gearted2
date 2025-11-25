"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippoService = void 0;
const axios_1 = __importDefault(require("axios"));
const SHIPPO_API_URL = 'https://api.goshippo.com';
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';
class ShippoService {
    static async createAddress(address) {
        try {
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/addresses`, address, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.error('[Shippo] Create address error:', error.response?.data || error.message);
            throw new Error('Failed to create shipping address');
        }
    }
    static async createParcel(parcel) {
        try {
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/parcels`, parcel, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.error('[Shippo] Create parcel error:', error.response?.data || error.message);
            throw new Error('Failed to create parcel');
        }
    }
    static async createShipment(fromAddress, toAddress, parcel) {
        try {
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/shipments`, {
                address_from: fromAddress,
                address_to: toAddress,
                parcels: [parcel],
                async: false,
            }, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.error('[Shippo] Create shipment error:', error.response?.data || error.message);
            throw new Error('Failed to create shipment');
        }
    }
    static async purchaseLabel(rateId) {
        try {
            const response = await axios_1.default.post(`${SHIPPO_API_URL}/transactions`, {
                rate: rateId,
                label_file_type: 'PDF',
                async: false,
            }, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.error('[Shippo] Purchase label error:', error.response?.data || error.message);
            throw new Error('Failed to purchase shipping label');
        }
    }
    static async getTracking(carrier, trackingNumber) {
        try {
            const response = await axios_1.default.get(`${SHIPPO_API_URL}/tracks/${carrier}/${trackingNumber}`, { headers: this.headers });
            return response.data;
        }
        catch (error) {
            console.error('[Shippo] Get tracking error:', error.response?.data || error.message);
            throw new Error('Failed to get tracking information');
        }
    }
    static async getShippingRates(fromAddress, toAddress, parcel) {
        const shipment = await this.createShipment(fromAddress, toAddress, parcel);
        const sortedRates = shipment.rates
            .filter((rate) => rate.provider !== 'USPS')
            .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        return {
            shipmentId: shipment.object_id,
            rates: sortedRates.map((rate) => ({
                rateId: rate.object_id,
                provider: rate.provider,
                serviceName: rate.servicelevel.name,
                price: parseFloat(rate.amount),
                currency: rate.currency,
                estimatedDays: rate.estimated_days,
            })),
        };
    }
    static async buyShippingLabel(rateId) {
        const transaction = await this.purchaseLabel(rateId);
        console.log('[Shippo] Purchase transaction response:', JSON.stringify(transaction, null, 2));
        if (transaction.status !== 'SUCCESS') {
            const errorMessages = transaction.messages || [];
            const errorDetails = errorMessages.map((m) => m.text).join(', ');
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
exports.ShippoService = ShippoService;
ShippoService.headers = {
    'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
};
//# sourceMappingURL=ShippoService.js.map