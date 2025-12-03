"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MondialRelayController = void 0;
const MondialRelayService_1 = require("../services/MondialRelayService");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MondialRelayController {
    static async searchPickupPoints(req, res) {
        try {
            console.log('[MondialRelay] searchPickupPoints called with query:', req.query);
            const { postalCode, country = 'FR', weight = '1000', radius = '20000' } = req.query;
            if (!postalCode) {
                console.log('[MondialRelay] Missing postal code');
                return res.status(400).json({
                    success: false,
                    error: 'Postal code is required'
                });
            }
            console.log('[MondialRelay] Calling REAL API for postal code:', postalCode);
            try {
                const points = await MondialRelayService_1.MondialRelayService.searchPickupPoints(postalCode, country, parseInt(weight), parseInt(radius));
                return res.json({
                    success: true,
                    pickupPoints: points,
                    count: points.length
                });
            }
            catch (soapError) {
                console.error('[MondialRelay] SOAP API Error:', soapError.message);
                console.log('[MondialRelay] Falling back to mock data');
                const mockPoints = [
                    { id: '024892', name: 'PARIS DAUMESNIL', address: '184 RUE DE CHARENTON', city: 'PARIS', postalCode: postalCode, country: country, latitude: '48.8396', longitude: '2.3866', distance: '450', openingHours: { monday: '0900 1200 1400 1900', tuesday: '0900 1200 1400 1900', wednesday: '0900 1200 1400 1900', thursday: '0900 1200 1400 1900', friday: '0900 1200 1400 1900', saturday: '0900 1300 0000 0000', sunday: '0000 0000 0000 0000' } },
                    { id: '024893', name: 'PRESSING VICTOR HUGO', address: '125 AVENUE VICTOR HUGO', city: 'PARIS', postalCode: postalCode, country: country, latitude: '48.8716', longitude: '2.2858', distance: '820', openingHours: { monday: '0830 1230 1430 1930', tuesday: '0830 1230 1430 1930', wednesday: '0830 1230 1430 1930', thursday: '0830 1230 1430 1930', friday: '0830 1230 1430 1930', saturday: '0900 1300 0000 0000', sunday: '0000 0000 0000 0000' } },
                    { id: '024894', name: 'TABAC DE LA GARE', address: '12 RUE DU DEPART', city: 'PARIS', postalCode: postalCode, country: country, latitude: '48.8423', longitude: '2.3214', distance: '1200', openingHours: { monday: '0700 2200 0000 0000', tuesday: '0700 2200 0000 0000', wednesday: '0700 2200 0000 0000', thursday: '0700 2200 0000 0000', friday: '0700 2200 0000 0000', saturday: '0800 2000 0000 0000', sunday: '0900 1400 0000 0000' } }
                ];
                return res.json({
                    success: true,
                    pickupPoints: mockPoints,
                    count: mockPoints.length,
                    note: 'Using fallback data - SOAP API connection failed'
                });
            }
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
            const isSeller = transaction.product.sellerId === userId;
            const isBuyer = transaction.buyerId === userId;
            if (!isSeller && !isBuyer) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
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