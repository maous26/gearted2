"use strict";
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
            const rates = await ShippoService_1.ShippoService.getShippingRates(fromAddress, toAddress, parcel);
            return res.json({
                success: true,
                ...rates
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
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { product: true }
            });
            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }
            if (transaction.product.sellerId !== userId) {
                return res.status(403).json({ error: 'Only the seller can purchase shipping label' });
            }
            const label = await ShippoService_1.ShippoService.buyShippingLabel(rateId);
            const updatedTransaction = await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    trackingNumber: label.trackingNumber,
                    metadata: {
                        ...(transaction.metadata || {}),
                        labelUrl: label.labelUrl,
                        trackingUrl: label.trackingUrl,
                        estimatedDelivery: label.estimatedDelivery
                    }
                }
            });
            return res.json({
                success: true,
                label,
                transaction: updatedTransaction
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