import { Router, Request, Response } from 'express';
import { PrismaClient, ProductCondition, ListingType } from '@prisma/client';
import { authenticate, optionalAuth } from '../middleware/auth';
import { sanitizeFields } from '../middleware/sanitize';

const router = Router();
const prisma = new PrismaClient();

// Base mock product data (fixtures pour remplir la grille si la base est vide)
const BASE_PRODUCTS = [
  {
    id: "1",
    title: "AK-74 Kalashnikov Réplique",
    price: 289.99,
    condition: "Excellent",
    location: "Paris, 75001",
    seller: "AirsoftPro92",
    rating: 4.8,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74"],
    category: "repliques",
    featured: true,
    createdAt: new Date().toISOString(),
    listingType: 'SALE',
  },
  {
    id: "2", 
    title: "Red Dot Sight - EOTech 552",
    price: 45.50,
    condition: "Très bon",
    location: "Lyon, 69000",
    seller: "TacticalGear",
    rating: 4.9,
    images: ["https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot"],
    category: "optiques",
    featured: true,
    createdAt: new Date().toISOString(),
    listingType: 'SALE',
  },
  {
    id: "3",
    title: "M4A1 SOPMOD Custom Build",
    price: 425.00,
    condition: "Neuf",
    location: "Marseille, 13000",
    seller: "CustomAirsoft",
    rating: 5.0,
    images: ["https://via.placeholder.com/200x150/2C3E50/FFFFFF?text=M4A1"],
    category: "repliques",
    featured: false,
    createdAt: new Date().toISOString(),
    listingType: 'TRADE',
    tradeFor: "Casque FAST ou upgrade interne AEG",
  },
  {
    id: "4",
    title: "Gilet Tactique MOLLE",
    price: 89.90,
    condition: "Bon",
    location: "Toulouse, 31000",
    seller: "MilitarySurplus",
    rating: 4.6,
    images: ["https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet"],
    category: "equipements",
    featured: false,
    createdAt: new Date().toISOString(),
    listingType: 'SALE',
  },
  {
    id: "5",
    title: "Lunette de Visée 3-9x40",
    price: 75.00,
    condition: "Excellent",
    location: "Bordeaux, 33000",
    seller: "OptiquesPro",
    rating: 4.7,
    images: ["https://via.placeholder.com/200x150/4682B4/FFFFFF?text=Scope"],
    category: "optiques",
    featured: false,
    createdAt: new Date().toISOString(),
    listingType: 'BOTH',
    tradeFor: "Red dot compact ou mount déporté",
  }
];

// Expand mock products to a larger catalog
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
  const titlesByCat: Record<string, string[]> = {
    repliques: ['M4A1', 'AK-74', 'G36C', 'MP5', 'SCAR-L', 'VSR-10'],
    optiques: ['Red Dot', 'Holographique', 'ACOG 4x', 'Scope 3-9x40'],
    equipements: ['Gilet Tactique', 'Casque FAST', 'Gants Mechanix', 'Holster'],
    pieces: ['Canon 6.03', 'Moteur High-Torque', 'Gearbox V2', 'Hop-Up'],
    munitions: ['Billes 0.25g', 'Billes 0.28g', 'Billes Bio 0.23g'],
  };
  const titlePool = titlesByCat[category] || ['Article Airsoft'];
  const title = `${titlePool[i % titlePool.length]} #${id}`;
  const hex = ['4B5D3A', '8B4513', '2C3E50', '556B2F', '4682B4', '2F4F4F'][i % 6];

  // Déterminer le type d'annonce mock
  const listingType = i % 3 === 0 ? 'TRADE' : i % 3 === 1 ? 'BOTH' : 'SALE';
  const tradeFor =
    listingType === 'SALE'
      ? undefined
      : listingType === 'TRADE'
      ? 'Ouvert aux échanges contre autre réplique ou équipement'
      : 'À vendre ou à échanger selon proposition';

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
    listingType,
    tradeFor,
  };
});

let MOCK_PRODUCTS = [...BASE_PRODUCTS, ...extraProducts];

// Track category views/searches for popularity
const categorySearchCounts: Record<string, number> = {};

// Mapping entre labels UI et enums Prisma
const CONDITION_LABEL_FROM_ENUM: Record<ProductCondition, string> = {
  NEW: 'Neuf',
  LIKE_NEW: 'Excellent',
  GOOD: 'Très bon',
  FAIR: 'Bon',
  POOR: 'Correct',
  FOR_PARTS: 'Pièces',
};

const CONDITION_ENUM_FROM_LABEL: Record<string, ProductCondition> = {
  Neuf: ProductCondition.NEW,
  Excellent: ProductCondition.LIKE_NEW,
  'Très bon': ProductCondition.GOOD,
  Bon: ProductCondition.FAIR,
  Correct: ProductCondition.POOR,
  Pièces: ProductCondition.FOR_PARTS,
};

function mapConditionLabelToEnum(label: string | undefined): ProductCondition {
  if (!label) return ProductCondition.GOOD;
  return CONDITION_ENUM_FROM_LABEL[label] ?? ProductCondition.GOOD;
}

function mapConditionEnumToLabel(condition: ProductCondition): string {
  return CONDITION_LABEL_FROM_ENUM[condition] ?? 'Bon';
}

function mapDbProductToListingShape(p: any) {
  const imageUrls = Array.isArray(p.images) ? p.images.map((img: any) => img.url) : [];
  const firstImage =
    imageUrls[0] ||
    `https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=${encodeURIComponent(
      p.title,
    )}`;

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: Number(p.price ?? 0),
    condition: mapConditionEnumToLabel(p.condition),
    location: p.location || 'Paris, 75001',
    seller: p.seller?.username || p.seller?.email || 'Vendeur',
    sellerId: p.sellerId,
    rating: 4.7, // TODO: brancher sur reviews quand dispo
    images: imageUrls.length ? imageUrls : [firstImage],
    category: p.category?.slug || 'autre',
    featured: false,
    createdAt: p.createdAt?.toISOString?.() ?? new Date().toISOString(),
    // Champs spécifiques vente / échange
    listingType: p.listingType,                // 'SALE' | 'TRADE' | 'BOTH'
    tradeFor: p.tradeFor || null,              // Ce que le vendeur cherche en échange
    handDelivery: p.handDelivery ?? false,     // Remise en main propre dispo
  };
}

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const sortBy = (req.query.sortBy as string) as
      | 'recent'
      | 'price_low'
      | 'price_high'
      | 'rating'
      | undefined;

    // 1) Récupérer les produits persistés en base
    const dbProductsRaw = await prisma.product.findMany({
      include: {
        images: true,
        category: true,
        seller: true,
      },
    });
    const dbProducts = dbProductsRaw.map(mapDbProductToListingShape);

    // 2) Fusionner avec les mocks pour conserver le catalogue de démo
    let products = [...dbProducts, ...MOCK_PRODUCTS];

    // 3) Filtre texte
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q),
      );
    }

    // 4) Filtre catégorie + suivi de popularité
    if (category) {
      products = products.filter((p) => p.category === category);
      categorySearchCounts[category] = (categorySearchCounts[category] || 0) + 1;
    }

    // 5) Tri
    if (sortBy === 'recent') {
      products.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === 'price_low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // 6) Pagination
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
  } catch (error) {
    console.error('[products] Failed to list products', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Get product by id (DB d'abord, mocks en fallback)
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
  } catch (error) {
    console.error('[products] Failed to get product by id', error);
    return res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get category statistics (product count per category)
router.get('/stats/categories', (req, res) => {
  const categoryCounts: Record<string, number> = {};
  
  MOCK_PRODUCTS.forEach(product => {
    const cat = product.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Combine product counts with search counts for popularity score
  const categoryPopularity = Object.keys({ ...categoryCounts, ...categorySearchCounts }).map(category => {
    const productCount = categoryCounts[category] || 0;
    const searchCount = categorySearchCounts[category] || 0;
    // Popularity score: product count + (search count * 2) to give more weight to searches
    const popularityScore = productCount + (searchCount * 2);
    
    return {
      category,
      count: productCount,
      searchCount,
      popularityScore
    };
  });

  // Sort by popularity score descending
  const sortedCategories = categoryPopularity.sort((a, b) => b.popularityScore - a.popularityScore);

  res.json({ categories: sortedCategories });
});

// Create product (persisté dans PostgreSQL + disponible pour le frontend)
router.post(
  '/',
  authenticate,
  sanitizeFields('title', 'description', 'location', 'tradeFor'),
  async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      title,
      description,
      price,
      condition,
      category,
      location,
      images = [],
      listingType,
      tradeFor,
      handDelivery,
    } = req.body;

    if (!title || !description || !condition || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use authenticated user's ID as sellerId
    const sellerId = req.user.userId;

    // Résoudre / créer la catégorie
    const categoryRecord = await prisma.category.upsert({
      where: { slug: category },
      update: {},
      create: {
        slug: category,
        name: category,
      },
    });

    // ListingType & condition
    const resolvedCondition = mapConditionLabelToEnum(condition);
    const allowedListingTypes: ListingType[] = [
      ListingType.SALE,
      ListingType.TRADE,
      ListingType.BOTH,
    ];
    const resolvedListingType =
      allowedListingTypes.find((t) => t === listingType) ?? ListingType.SALE;

    const numericPrice =
      typeof price === 'number'
        ? price
        : price
        ? Number(price)
        : 0;

    // Slug produit simple et unique
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
        listingType: resolvedListingType,
        tradeFor:
          resolvedListingType === ListingType.TRADE ||
          resolvedListingType === ListingType.BOTH
            ? tradeFor
            : undefined,
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
        data: images.map((url: string, index: number) => ({
          productId: product.id,
          url,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    }

    // Recharger avec images fraîchement créées
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

    // On ne touche pas à MOCK_PRODUCTS ici pour éviter les doublons :
    // les produits persistés viennent déjà de la base dans GET /api/products.
    return res.status(201).json(mapped);
  } catch (e) {
    console.error('[products] Failed to create product', e);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;