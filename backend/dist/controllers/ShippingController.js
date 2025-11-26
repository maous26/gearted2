"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingController = void 0;
const client_1 = require("@prisma/client");
const ShippoService_1 = require("../services/ShippoService");
const prisma = new client_1.PrismaClient();
class ShippingController {
    static async addShippingAddress(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const { name, street1, street2, city, state, zip, country, phone, email } = req.body;
            let transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { buyer: true, product: true }
            });
            if (!transaction) {
                transaction = await prisma.transaction.findUnique({
                    where: { paymentIntentId: transactionId },
                    include: { buyer: true, product: true }
                });
            }
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            if (transaction.buyerId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    shippingAddress: {
                        name,
                        street1,
                        street2,
                        city,
                        state,
                        zip,
                        country,
                        phone,
                        email
                    }
                }
            });
            return res.json({
                success: true,
                transaction: updatedTransaction
            });
        }
        catch (error) {
            console.error('[Shipping] Add address error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getShippingRates(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const { length, width, height, weight } = req.body;
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    product: {
                        include: { seller: true }
                    }
                }
            });
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            if (transaction.product.sellerId !== userId) {
                return res.status(403).json({ error: 'Only the seller can get shipping rates' });
            }
            if (!transaction.shippingAddress) {
                return res.status(400).json({ error: 'Shipping address not provided yet' });
            }
            const fromAddress = {
                name: transaction.product.seller.username,
                street1: '123 Rue Example',
                city: 'Paris',
                state: 'IDF',
                zip: '75001',
                country: 'FR',
                email: transaction.product.seller.email
            };
            const toAddress = transaction.shippingAddress;
            const parcel = {
                length: length.toString(),
                width: width.toString(),
                height: height.toString(),
                distance_unit: 'cm',
                weight: weight.toString(),
                mass_unit: 'kg'
            };
            const mondialRelayRates = await Promise.resolve().then(() => __importStar(require('../services/MondialRelayService'))).then(module => module.MondialRelayService.getShippingRates(parseFloat(weight) * 1000, toAddress.country || 'FR'));
            const allRates = [
                {
                    rateId: 'mondial-relay-standard',
                    provider: 'Mondial Relay',
                    servicelevel: { name: 'Point Relais', token: 'PR' },
                    servicelevelName: 'Point Relais',
                    amount: mondialRelayRates.standard.toFixed(2),
                    currency: 'EUR',
                    estimatedDays: 3
                },
                {
                    rateId: 'mondial-relay-express',
                    provider: 'Mondial Relay',
                    servicelevel: { name: 'Domicile', token: 'DOM' },
                    servicelevelName: 'Domicile',
                    amount: mondialRelayRates.express.toFixed(2),
                    currency: 'EUR',
                    estimatedDays: 2
                }
            ];
            return res.json({
                success: true,
                shipmentId: null,
                rates: allRates
            });
        }
        catch (error) {
            console.error('[Shipping] Get rates error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async purchaseLabel(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const { rateId } = req.body;
            if (rateId.startsWith('mondial-relay-')) {
                return res.status(400).json({
                    success: false,
                    error: 'For Mondial Relay labels, use /api/mondialrelay/label/:transactionId with pickupPointId and weight'
                });
            }
            return res.status(501).json({
                success: false,
                error: 'Shippo is disabled. Please use direct carrier APIs: /api/mondialrelay/label for Mondial Relay'
            });
        }
        catch (error) {
            console.error('[Shipping] Purchase label error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getTracking(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    product: true,
                    buyer: true
                }
            });
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            if (transaction.buyerId !== userId && transaction.product.sellerId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            if (!transaction.trackingNumber) {
                return res.status(404).json({ error: 'No tracking number available yet' });
            }
            const metadata = transaction.metadata;
            const carrier = metadata?.carrier || 'unknown';
            const tracking = await ShippoService_1.ShippoService.getTracking(carrier, transaction.trackingNumber);
            return res.json({
                success: true,
                tracking,
                trackingNumber: transaction.trackingNumber,
                trackingUrl: metadata?.trackingUrl
            });
        }
        catch (error) {
            console.error('[Shipping] Get tracking error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getPendingShipments(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const pendingShipments = await prisma.transaction.findMany({
                where: {
                    product: {
                        sellerId: userId
                    },
                    status: 'SUCCEEDED',
                    shippingAddress: {
                        not: client_1.Prisma.DbNull
                    },
                    trackingNumber: null
                },
                include: {
                    product: true,
                    buyer: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return res.json({
                success: true,
                shipments: pendingShipments
            });
        }
        catch (error) {
            console.error('[Shipping] Get pending shipments error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async deleteShippingAddress(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { product: true }
            });
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            if (transaction.buyerId !== userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    shippingAddress: client_1.Prisma.DbNull
                }
            });
            return res.json({
                success: true,
                message: 'Shipping address deleted successfully'
            });
        }
        catch (error) {
            console.error('[Shipping] Delete address error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getMyShippingAddresses(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const transactions = await prisma.transaction.findMany({
                where: {
                    buyerId: userId,
                    shippingAddress: {
                        not: client_1.Prisma.DbNull
                    }
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            images: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return res.json({
                success: true,
                addresses: transactions.map((t) => ({
                    transactionId: t.id,
                    address: t.shippingAddress,
                    productTitle: t.product.title,
                    productImage: t.product.images?.[0],
                    createdAt: t.createdAt,
                    trackingNumber: t.trackingNumber
                }))
            });
        }
        catch (error) {
            console.error('[Shipping] Get my addresses error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.ShippingController = ShippingController;
//# sourceMappingURL=ShippingController.js.map