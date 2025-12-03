"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const sanitize_1 = require("../middleware/sanitize");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const categorySearchCounts = {};
const CONDITION_LABEL_FROM_ENUM = {
    NEW: 'Neuf',
    LIKE_NEW: 'Excellent',
    GOOD: 'Très bon',
    FAIR: 'Bon',
    POOR: 'Correct',
    FOR_PARTS: 'Pièces',
};
const CONDITION_ENUM_FROM_LABEL = {
    Neuf: client_1.ProductCondition.NEW,
    Excellent: client_1.ProductCondition.LIKE_NEW,
    'Très bon': client_1.ProductCondition.GOOD,
    Bon: client_1.ProductCondition.FAIR,
    Correct: client_1.ProductCondition.POOR,
    Pièces: client_1.ProductCondition.FOR_PARTS,
};
function mapConditionLabelToEnum(label) {
    if (!label)
        return client_1.ProductCondition.GOOD;
    return CONDITION_ENUM_FROM_LABEL[label] ?? client_1.ProductCondition.GOOD;
}
function mapConditionEnumToLabel(condition) {
    return CONDITION_LABEL_FROM_ENUM[condition] ?? 'Bon';
}
function mapDbProductToListingShape(p) {
    const imageUrls = Array.isArray(p.images) ? p.images.map((img) => img.url) : [];
    const firstImage = imageUrls[0] ||
        `https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=${encodeURIComponent(p.title)}`;
    return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: Number(p.price ?? 0),
        condition: mapConditionEnumToLabel(p.condition),
        location: p.location || 'Paris, 75001',
        seller: p.seller?.username || p.seller?.email || 'Vendeur',
        sellerId: p.sellerId,
        sellerRole: p.seller?.role || undefined,
        sellerBadges: p.seller?.badges || [],
        rating: 4.7,
        images: imageUrls.length ? imageUrls : [firstImage],
        category: p.category?.slug || 'autre',
        featured: false,
        createdAt: p.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
}
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const category = req.query.category;
        const sortBy = req.query.sortBy;
        const now = new Date();
        const dbProductsRaw = await prisma.product.findMany({
            where: {
                AND: [
                    { status: 'ACTIVE' },
                    { paymentCompleted: false },
                    {
                        OR: [
                            { deletionScheduledAt: null },
                            { deletionScheduledAt: { gt: now } }
                        ]
                    }
                ]
            },
            include: {
                images: true,
                category: true,
                seller: true,
            },
        });
        const dbProducts = dbProductsRaw.map(mapDbProductToListingShape);
        console.log(`[Products] Returning ${dbProducts.length} real products from database`);
        let products = [...dbProducts];
        if (search) {
            const q = search.toLowerCase();
            products = products.filter((p) => p.title.toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q));
        }
        if (category) {
            products = products.filter((p) => p.category === category);
            categorySearchCounts[category] = (categorySearchCounts[category] || 0) + 1;
        }
        if (sortBy === 'recent') {
            products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        else if (sortBy === 'price_low') {
            products.sort((a, b) => a.price - b.price);
        }
        else if (sortBy === 'price_high') {
            products.sort((a, b) => b.price - a.price);
        }
        else if (sortBy === 'rating') {
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        res.json({
            products: paginatedProducts,
            total: products.length,
            page,
            limit,
            hasMore: endIndex < products.length,
        });
    }
    catch (error) {
        console.error('[products] Failed to list products', error);
        res.status(500).json({ error: 'Failed to list products' });
    }
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const dbProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                category: true,
                seller: true,
            },
        });
        if (dbProduct) {
            return res.json(mapDbProductToListingShape(dbProduct));
        }
        return res.status(404).json({ error: 'Product not found' });
    }
    catch (error) {
        console.error('[products] Failed to get product by id', error);
        return res.status(500).json({ error: 'Failed to get product' });
    }
});
router.get('/stats/categories', async (_req, res) => {
    const categoryCounts = {};
    const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { category: true }
    });
    products.forEach(product => {
        const cat = product.category?.slug || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const categoryPopularity = Object.keys({ ...categoryCounts, ...categorySearchCounts }).map(category => {
        const productCount = categoryCounts[category] || 0;
        const searchCount = categorySearchCounts[category] || 0;
        const popularityScore = productCount + (searchCount * 2);
        return {
            category,
            count: productCount,
            searchCount,
            popularityScore
        };
    });
    const sortedCategories = categoryPopularity.sort((a, b) => b.popularityScore - a.popularityScore);
    res.json({ categories: sortedCategories });
});
router.post('/', auth_1.authenticate, (0, sanitize_1.sanitizeFields)('title', 'description', 'location'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { title, description, price, condition, category, location, images = [], } = req.body;
        if (!title || !description || !condition || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const sellerId = req.user.userId;
        const categoryRecord = await prisma.category.upsert({
            where: { slug: category },
            update: {},
            create: {
                slug: category,
                name: category,
            },
        });
        const resolvedCondition = mapConditionLabelToEnum(condition);
        const numericPrice = typeof price === 'number'
            ? price
            : price
                ? Number(price)
                : 0;
        const baseSlug = title
            .toLowerCase()
            .replace(/[^\w]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        const product = await prisma.product.create({
            data: {
                title,
                description,
                slug,
                categoryId: categoryRecord.id,
                sellerId,
                condition: resolvedCondition,
                price: numericPrice,
                currency: 'EUR',
                status: 'ACTIVE',
                isActive: true,
                location: location || 'Paris, 75001',
                shippingIncluded: false,
                shippingCost: null,
            },
            include: {
                images: true,
                category: true,
                seller: true,
            },
        });
        if (images.length) {
            await prisma.productImage.createMany({
                data: images.map((url, index) => ({
                    productId: product.id,
                    url,
                    sortOrder: index,
                    isPrimary: index === 0,
                })),
            });
        }
        const productWithImages = await prisma.product.findUnique({
            where: { id: product.id },
            include: {
                images: true,
                category: true,
                seller: true,
            },
        });
        if (!productWithImages) {
            return res.status(500).json({ error: 'Failed to hydrate product after creation' });
        }
        const mapped = mapDbProductToListingShape(productWithImages);
        return res.status(201).json(mapped);
    }
    catch (e) {
        console.error('[products] Failed to create product', e);
        return res.status(500).json({ error: 'Failed to create product' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map