"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authenticate);
router.post('/products/:productId/parcel-dimensions', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { productId } = req.params;
    const { length, width, height, weight } = req.body;
    if (!length || !width || !height || !weight) {
        return res.status(400).json({
            error: 'Toutes les dimensions sont requises (longueur, largeur, hauteur, poids)'
        });
    }
    const dimensions = {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight)
    };
    if (Object.values(dimensions).some(v => isNaN(v) || v <= 0)) {
        return res.status(400).json({
            error: 'Toutes les dimensions doivent être des nombres positifs'
        });
    }
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        if (product.sellerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à modifier ce produit'
            });
        }
        let parcelDimensions;
        if (product.parcelDimensionsId) {
            parcelDimensions = await prisma.parcelDimensions.update({
                where: { id: product.parcelDimensionsId },
                data: dimensions
            });
        }
        else {
            parcelDimensions = await prisma.parcelDimensions.create({
                data: dimensions
            });
            await prisma.product.update({
                where: { id: productId },
                data: { parcelDimensionsId: parcelDimensions.id }
            });
        }
        const updateData = {};
        if (product.paymentCompleted && product.status !== 'SOLD') {
            updateData.status = 'SOLD';
            updateData.soldAt = new Date();
            console.log(`[Shipping] Produit ${productId} marqué comme SOLD (paiement + dimensions renseignées)`);
        }
        const updated = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: { parcelDimensions: true }
        });
        return res.json({
            success: true,
            product: updated,
            parcelDimensions,
            message: updated.status === 'SOLD'
                ? 'Dimensions enregistrées. Produit marqué comme vendu ✓'
                : 'Dimensions enregistrées. En attente du paiement.'
        });
    }
    catch (error) {
        console.error('[Shipping] Error updating parcel dimensions:', error);
        return res.status(500).json({
            error: 'Erreur lors de la mise à jour des dimensions'
        });
    }
});
router.post('/products/:productId/payment-completed', async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        const updateData = {
            paymentCompleted: true,
            paymentCompletedAt: new Date()
        };
        if (product.parcelDimensionsId && product.status !== 'SOLD') {
            updateData.status = 'SOLD';
            updateData.soldAt = new Date();
            console.log(`[Payment] Produit ${productId} marqué comme SOLD (paiement + dimensions renseignées)`);
        }
        const updated = await prisma.product.update({
            where: { id: productId },
            data: updateData
        });
        return res.json({
            success: true,
            product: updated,
            message: updated.status === 'SOLD'
                ? 'Paiement confirmé. Produit marqué comme vendu ✓'
                : 'Paiement confirmé. En attente du poids du colis.'
        });
    }
    catch (error) {
        console.error('[Payment] Error marking payment completed:', error);
        return res.status(500).json({
            error: 'Erreur lors de la confirmation du paiement'
        });
    }
});
router.get('/products/:productId/shipping-info', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { productId } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                title: true,
                status: true,
                parcelDimensionsId: true,
                parcelDimensions: true,
                paymentCompleted: true,
                paymentCompletedAt: true,
                soldAt: true,
                sellerId: true
            }
        });
        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        if (product.sellerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à voir ces informations'
            });
        }
        const hasDimensions = !!product.parcelDimensionsId;
        return res.json({
            product,
            hasDimensions,
            canMarkAsSold: product.paymentCompleted && hasDimensions,
            needsDimensions: product.paymentCompleted && !hasDimensions,
            needsPayment: !product.paymentCompleted,
            canChooseShipping: hasDimensions
        });
    }
    catch (error) {
        console.error('[Shipping] Error fetching shipping info:', error);
        return res.status(500).json({
            error: 'Erreur lors de la récupération des informations'
        });
    }
});
router.post('/rates/:transactionId', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { transactionId } = req.params;
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                product: {
                    include: {
                        parcelDimensions: true
                    }
                },
                buyer: true
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        if (transaction.buyerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à accéder à cette transaction'
            });
        }
        if (!transaction.product.parcelDimensions) {
            return res.status(400).json({
                error: 'Les dimensions du colis ne sont pas encore définies par le vendeur'
            });
        }
        if (!transaction.shippingAddress) {
            return res.status(400).json({
                error: 'L\'adresse de livraison n\'est pas définie'
            });
        }
        const dimensions = transaction.product.parcelDimensions;
        const basePrice = Math.max(5, (dimensions.weight * 3) + ((dimensions.length + dimensions.width + dimensions.height) / 100));
        const rates = [
            {
                rateId: 'colissimo-standard',
                provider: 'Colissimo',
                servicelevel: {
                    name: 'Domicile',
                    token: 'colissimo-domicile'
                },
                amount: basePrice.toFixed(2),
                currency: 'EUR',
                estimatedDays: 2
            },
            {
                rateId: 'colissimo-relais',
                provider: 'Colissimo',
                servicelevel: {
                    name: 'Point Relais',
                    token: 'colissimo-relais'
                },
                amount: (basePrice * 0.8).toFixed(2),
                currency: 'EUR',
                estimatedDays: 3
            },
            {
                rateId: 'chronopost-express',
                provider: 'Chronopost',
                servicelevel: {
                    name: 'Express',
                    token: 'chronopost-express'
                },
                amount: (basePrice * 1.5).toFixed(2),
                currency: 'EUR',
                estimatedDays: 1
            }
        ];
        return res.json({
            success: true,
            rates,
            dimensions
        });
    }
    catch (error) {
        console.error('[Shipping] Error getting rates:', error);
        return res.status(500).json({
            error: 'Erreur lors de la récupération des tarifs'
        });
    }
});
router.post('/label/:transactionId', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { transactionId } = req.params;
    const { rateId } = req.body;
    if (!rateId) {
        return res.status(400).json({ error: 'Le tarif de livraison est requis' });
    }
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                product: {
                    include: {
                        parcelDimensions: true,
                        seller: true
                    }
                },
                buyer: true
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        if (transaction.buyerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à accéder à cette transaction'
            });
        }
        if (transaction.trackingNumber) {
            return res.status(400).json({
                error: 'Une étiquette a déjà été créée pour cette transaction'
            });
        }
        const trackingNumber = `${rateId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                trackingNumber,
                status: 'PROCESSING'
            },
            include: {
                product: true,
                buyer: true
            }
        });
        const labelUrl = `https://example.com/labels/${trackingNumber}.pdf`;
        return res.json({
            success: true,
            label: {
                trackingNumber,
                labelUrl,
                carrier: rateId.split('-')[0]
            },
            transaction: updatedTransaction
        });
    }
    catch (error) {
        console.error('[Shipping] Error generating label:', error);
        return res.status(500).json({
            error: 'Erreur lors de la génération de l\'étiquette'
        });
    }
});
router.post('/dimensions/:transactionId', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { transactionId } = req.params;
    const { length, width, height, weight } = req.body;
    if (!length || !width || !height || !weight) {
        return res.status(400).json({
            error: 'Toutes les dimensions sont requises'
        });
    }
    const dimensions = {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight)
    };
    if (Object.values(dimensions).some(v => isNaN(v) || v <= 0)) {
        return res.status(400).json({
            error: 'Toutes les dimensions doivent être des nombres positifs'
        });
    }
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                product: {
                    include: {
                        parcelDimensions: true
                    }
                }
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        if (transaction.product.sellerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Vous n\'êtes pas autorisé à modifier ce produit'
            });
        }
        let parcelDimensions;
        if (transaction.product.parcelDimensionsId) {
            parcelDimensions = await prisma.parcelDimensions.update({
                where: { id: transaction.product.parcelDimensionsId },
                data: dimensions
            });
        }
        else {
            parcelDimensions = await prisma.parcelDimensions.create({
                data: dimensions
            });
            await prisma.product.update({
                where: { id: transaction.product.id },
                data: { parcelDimensionsId: parcelDimensions.id }
            });
        }
        const updateData = {};
        if (transaction.product.paymentCompleted && transaction.product.status !== 'SOLD') {
            updateData.status = 'SOLD';
            updateData.soldAt = new Date();
            await prisma.product.update({
                where: { id: transaction.product.id },
                data: updateData
            });
            console.log(`[Shipping] Produit ${transaction.product.id} marqué comme SOLD`);
        }
        return res.json({
            success: true,
            parcelDimensions,
            message: 'Dimensions enregistrées avec succès'
        });
    }
    catch (error) {
        console.error('[Shipping] Error saving dimensions:', error);
        return res.status(500).json({
            error: 'Erreur lors de l\'enregistrement des dimensions'
        });
    }
});
exports.default = router;
//# sourceMappingURL=shipping.js.map