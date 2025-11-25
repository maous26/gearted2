"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.userId;
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ productIds: favorites.map((fav) => fav.productId) });
    }
    catch (error) {
        console.error('[favorites] Failed to fetch favorites', error);
        return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});
router.post('/:productId/toggle', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.userId;
    const { productId } = req.params;
    if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
    }
    try {
        const existing = await prisma.favorite.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
        if (existing) {
            await prisma.favorite.delete({
                where: { id: existing.id },
            });
        }
        else {
            await prisma.favorite.create({
                data: {
                    userId,
                    productId,
                },
            });
        }
        const favorites = await prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ productIds: favorites.map((fav) => fav.productId) });
    }
    catch (error) {
        console.error('[favorites] Failed to toggle favorite', error);
        return res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});
exports.default = router;
//# sourceMappingURL=favorites.js.map