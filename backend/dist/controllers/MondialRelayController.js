"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MondialRelayController = void 0;
const MondialRelayService_1 = require("../services/MondialRelayService");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MondialRelayController {
    static async searchPickupPoints(req, res) {
        try {
            const { postalCode, country = 'FR', weight = '1000', radius = '20000' } = req.query;
            if (!postalCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Postal code is required'
                });
            }
            const points = await MondialRelayService_1.MondialRelayService.searchPickupPoints(postalCode, country, parseInt(weight), parseInt(radius));
            return res.json({
                success: true,
                pickupPoints: points,
                count: points.length
            });
        }
        catch (error) {
            console.error('[MondialRelayController] Search pickup points error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getShippingRates(req, res) {
        try {
            const { weight = '1000', country = 'FR' } = req.query;
            const rates = await MondialRelayService_1.MondialRelayService.getShippingRates(parseInt(weight), country);
            return res.json({
                success: true,
                rates: {
                    standard: {
                        name: 'Mondial Relay - Point Relais',
                        price: rates.standard,
                        currency: 'EUR',
                        estimatedDays: 3
                    },
                    express: {
                        name: 'Mondial Relay - Domicile',
                        price: rates.express,
                        currency: 'EUR',
                        estimatedDays: 2
                    }
                }
            });
        }
        catch (error) {
            console.error('[MondialRelayController] Get rates error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async createLabel(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { transactionId } = req.params;
            const { pickupPointId, weight } = req.body;
            if (!pickupPointId || !weight) {
                return res.status(400).json({
                    success: false,
                    error: 'Pickup point ID and weight are required'
                });
            }
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    product: {
                        include: { seller: true }
                    },
                    buyer: true
                }
            });
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }
            if (transaction.product.sellerId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the seller can create shipping labels'
                });
            }
            if (!transaction.shippingAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Shipping address not provided'
                });
            }
            const shippingAddr = transaction.shippingAddress;
            const senderAddress = {
                name: transaction.product.seller.username,
                address: '123 Rue Example',
                city: 'Paris',
                postalCode: '75001',
                country: 'FR',
                phone: '0600000000',
                email: transaction.product.seller.email
            };
            const recipientAddress = {
                name: shippingAddr.name || transaction.buyer.username,
                address: shippingAddr.street1,
                city: shippingAddr.city,
                postalCode: shippingAddr.zip,
                country: shippingAddr.country || 'FR',
                phone: shippingAddr.phone || '0600000000',
                email: shippingAddr.email || transaction.buyer.email
            };
            const label = await MondialRelayService_1.MondialRelayService.createShippingLabel(senderAddress, recipientAddress, pickupPointId, weight, transaction.id);
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    trackingNumber: label.expeditionNumber,
                    metadata: {
                        ...(transaction.metadata || {}),
                        shippingLabelUrl: label.labelUrl,
                        shippingProvider: 'MondialRelay',
                        pickupPointId: pickupPointId
                    }
                }
            });
            return res.json({
                success: true,
                label: {
                    expeditionNumber: label.expeditionNumber,
                    labelUrl: label.labelUrl,
                    trackingUrl: label.trackingUrl
                },
                transaction: updatedTransaction
            });
        }
        catch (error) {
            console.error('[MondialRelayController] Create label error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getTracking(req, res) {
        try {
            const { expeditionNumber } = req.params;
            const trackingUrl = `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${expeditionNumber}`;
            return res.json({
                success: true,
                expeditionNumber,
                trackingUrl,
                message: 'Visit tracking URL for detailed status'
            });
        }
        catch (error) {
            console.error('[MondialRelayController] Get tracking error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.MondialRelayController = MondialRelayController;
//# sourceMappingURL=MondialRelayController.js.map