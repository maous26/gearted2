"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const sanitize_1 = require("../middleware/sanitize");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const BASE_PRODUCTS = [
    {
        id: "1",
        title: "AK-74 Kalashnikov Réplique",
        price: 289.99,
        condition: "Excellent",
        location: "Paris, 75001",
        seller: "AirsoftPro92",
        sellerId: "mock-user-1",
        sellerRole: "USER",
        sellerBadges: ["verified", "premium"],
        rating: 4.8,
        images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74"],
        category: "repliques",
        featured: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Red Dot Sight - EOTech 552",
        price: 45.50,
        condition: "Très bon",
        location: "Lyon, 69000",
        seller: "TacticalGear",
        sellerId: "mock-user-2",
        sellerRole: "USER",
        sellerBadges: ["verified", "founder"],
        rating: 4.9,
        images: ["https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot"],
        category: "optiques",
        featured: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: "3",
        title: "M4A1 SOPMOD Custom Build",
        price: 425.00,
        condition: "Neuf",
        location: "Marseille, 13000",
        seller: "CustomAirsoft",
        sellerId: "mock-user-3",
        sellerRole: "ADMIN",
        sellerBadges: ["verified", "admin"],
        rating: 5.0,
        images: ["https://via.placeholder.com/200x150/2C3E50/FFFFFF?text=M4A1"],
        category: "repliques",
        featured: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: "4",
        title: "Gilet Tactique MOLLE",
        price: 89.90,
        condition: "Bon",
        location: "Toulouse, 31000",
        seller: "MilitarySurplus",
        sellerId: "mock-user-4",
        sellerRole: "USER",
        sellerBadges: ["verified"],
        rating: 4.6,
        images: ["https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet"],
        category: "equipements",
        featured: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: "5",
        title: "Lunette de Visée 3-9x40",
        price: 75.00,
        condition: "Excellent",
        location: "Bordeaux, 33000",
        seller: "OptiquesPro",
        sellerId: "mock-user-5",
        sellerRole: "MODERATOR",
        sellerBadges: ["verified", "moderator"],
        rating: 4.7,
        images: ["https://via.placeholder.com/200x150/4682B4/FFFFFF?text=Scope"],
        category: "optiques",
        featured: false,
        createdAt: new Date().toISOString(),
    }
];
const extraProducts = Array.from({ length: 40 }).map((_, i) => {
    const id = (i + 10).toString();
    const categories = ['repliques', 'optiques', 'equipements', 'pieces', 'munitions'];
    const conds = ['Neuf', 'Excellent', 'Très bon', 'Bon'];
    const cities = [
        'Paris, 75001',
        'Lyon, 69000',
        'Marseille, 13000',
        'Toulouse, 31000',
        'Bordeaux, 33000',
        'Nice, 06000',
        'Nantes, 44000',
        'Lille, 59000',
    ];
    const category = categories[i % categories.length];
    const condition = conds[i % conds.length];
    const location = cities[i % cities.length];
    const price = Number((20 + (i % 15) * 12.5 + (i % 7) * 3.2).toFixed(2));
    const seller = `Seller${(i % 20) + 1}`;
    const rating = Number((3.8 + (i % 12) * 0.1).toFixed(1));
    const titlesByCat = {
        repliques: ['M4A1', 'AK-74', 'G36C', 'MP5', 'SCAR-L', 'VSR-10'],
        optiques: ['Red Dot', 'Holographique', 'ACOG 4x', 'Scope 3-9x40'],
        equipements: ['Gilet Tactique', 'Casque FAST', 'Gants Mechanix', 'Holster'],
        pieces: ['Canon 6.03', 'Moteur High-Torque', 'Gearbox V2', 'Hop-Up'],
        munitions: ['Billes 0.25g', 'Billes 0.28g', 'Billes Bio 0.23g'],
    };
    const titlePool = titlesByCat[category] || ['Article Airsoft'];
    const title = `${titlePool[i % titlePool.length]} #${id}`;
    const hex = ['4B5D3A', '8B4513', '2C3E50', '556B2F', '4682B4', '2F4F4F'][i % 6];
    return {
        id,
        title,
        price,
        condition,
        location,
        seller,
        sellerId: `u${(i % 20) + 1}`,
        rating,
        images: [`https://via.placeholder.com/400x300/${hex}/FFFFFF?text=${encodeURIComponent(title)}`],
        category,
        featured: i % 9 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        description: `${title} en ${condition}. Parfait pour compléter ton setup.`,
    };
});
let MOCK_PRODUCTS = [...BASE_PRODUCTS, ...extraProducts];
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
        const dbProductsRaw = await prisma.product.findMany({
            include: {
                images: true,
                category: true,
                seller: true,
            },
        });
        const dbProducts = dbProductsRaw.map(mapDbProductToListingShape);
        let products = [...dbProducts, ...MOCK_PRODUCTS];
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
        const mockProduct = MOCK_PRODUCTS.find((p) => p.id === id);
        if (!mockProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.json(mockProduct);
    }
    catch (error) {
        console.error('[products] Failed to get product by id', error);
        return res.status(500).json({ error: 'Failed to get product' });
    }
});
router.get('/stats/categories', (req, res) => {
    const categoryCounts = {};
    MOCK_PRODUCTS.forEach(product => {
        const cat = product.category || 'other';
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