import { Router, Request, Response } from 'express';
import { PrismaClient, ProductCondition } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { sanitizeFields } from '../middleware/sanitize';

const router = Router();
const prisma = new PrismaClient();

// ALL MOCK DATA REMOVED - Production mode with real database only
/*
const BASE_PRODUCTS_DISABLED = [
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

// Expand mock products to a larger catalog (DISABLED)
const extraProducts_DISABLED = Array.from({ length: 40 }).map((_, i) => {
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
*/

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
    sellerRole: p.seller?.role || undefined,
    sellerBadges: p.seller?.badges || [],
    rating: 4.7, // TODO: brancher sur reviews quand dispo
    images: imageUrls.length ? imageUrls : [firstImage],
    category: p.category?.slug || 'autre',
    featured: p.featured || false,
    status: p.status || 'ACTIVE',
    createdAt: p.createdAt?.toISOString?.() ?? new Date().toISOString(),
    handDelivery: p.handDelivery || false,
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
    // Exclure les produits vendus (paymentCompleted = true) et les produits non actifs
    const dbProductsRaw = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',           // Seulement les produits actifs
        paymentCompleted: false,    // Exclure dès que le paiement est effectué
      },
      include: {
        images: true,
        category: true,
        seller: true,
      },
    });
    const dbProducts = dbProductsRaw.map(mapDbProductToListingShape);

    // 2) Return only real database products (no mocks in production)
    console.log(`[Products] Returning ${dbProducts.length} real products from database`);
    let products = [...dbProducts];

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

// Get featured products (boosted if enabled, random otherwise)
// NOTE: This route MUST be defined BEFORE /:id to avoid "featured" being treated as an ID
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    // Check boost settings
    const boostSettings = await (prisma as any).platformSettings?.findUnique({
      where: { key: 'boost_settings' }
    });

    const settings = boostSettings?.value || { enabled: false };
    const boostEnabled = settings.enabled === true;

    let featuredProducts: any[] = [];

    if (boostEnabled) {
      // Get boosted products
      const boostedProducts = await (prisma as any).productBoost?.findMany({
        where: {
          status: 'ACTIVE',
          endsAt: { gt: new Date() },
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              seller: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        take: limit,
      });

      featuredProducts = (boostedProducts || []).map((boost: any) => ({
        ...mapDbProductToListingShape(boost.product),
        boost: {
          id: boost.id,
          type: boost.boostType,
          endsAt: boost.endsAt,
        },
      }));
    }

    // If no boosted products or boost disabled, get random products
    if (featuredProducts.length < limit) {
      const remaining = limit - featuredProducts.length;
      const boostedIds = featuredProducts.map(p => p.id);

      // Get random products (excluding already boosted ones)
      const randomProducts = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          paymentCompleted: false,
          id: { notIn: boostedIds },
        },
        include: {
          images: true,
          category: true,
          seller: true,
        },
      });

      // Shuffle and take remaining
      const shuffled = randomProducts.sort(() => Math.random() - 0.5);
      const randomMapped = shuffled.slice(0, remaining).map(mapDbProductToListingShape);

      featuredProducts = [...featuredProducts, ...randomMapped];
    }

    res.json({
      products: featuredProducts,
      boostEnabled,
      total: featuredProducts.length,
    });
  } catch (error) {
    console.error('[products] Failed to get featured products', error);
    res.status(500).json({ error: 'Failed to get featured products' });
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

    // Pas de données mock - retourner 404 si produit non trouvé
    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error('[products] Failed to get product by id', error);
    return res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get category statistics (product count per category)
router.get('/stats/categories', async (_req, res) => {
  const categoryCounts: Record<string, number> = {};

  // Compter les produits réels de la base de données
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true }
  });

  products.forEach(product => {
    const cat = product.category?.slug || 'other';
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
  sanitizeFields('title', 'description', 'location'),
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
      // Catégorie d'expédition (obligatoire si pas de remise en main propre)
      shippingCategory,
      // Dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
      customParcelLength,
      customParcelWidth,
      customParcelHeight,
      customParcelWeight,
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

    // Condition mapping
    const resolvedCondition = mapConditionLabelToEnum(condition);

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
        status: 'ACTIVE',
        isActive: true,
        location: location || 'Paris, 75001',
        shippingIncluded: false,
        shippingCost: null,
        // Catégorie d'expédition
        shippingCategory: shippingCategory || null,
        // Dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
        customParcelLength: customParcelLength ? Number(customParcelLength) : null,
        customParcelWidth: customParcelWidth ? Number(customParcelWidth) : null,
        customParcelHeight: customParcelHeight ? Number(customParcelHeight) : null,
        customParcelWeight: customParcelWeight ? Number(customParcelWeight) : null,
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

// Update product (only by seller, before purchase)
router.put(
  '/:id',
  authenticate,
  sanitizeFields('title', 'description', 'location'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const userId = req.user.userId;

      // Vérifier que le produit existe et appartient au vendeur
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { parcelDimensions: true }
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (existingProduct.sellerId !== userId) {
        return res.status(403).json({ error: 'You can only edit your own products' });
      }

      // Vérifier que le produit n'a pas été acheté
      if (existingProduct.paymentCompleted || existingProduct.status === 'SOLD') {
        return res.status(400).json({ error: 'Cannot edit a sold product' });
      }

      const {
        title,
        description,
        price,
        condition,
        category,
        location,
        images = [],
        // Catégorie d'expédition
        shippingCategory,
        // Dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
        customParcelLength,
        customParcelWidth,
        customParcelHeight,
        customParcelWeight,
      } = req.body;

      // Préparer les données de mise à jour
      const updateData: any = {};

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (location) updateData.location = location;
      if (price !== undefined) {
        updateData.price = typeof price === 'number' ? price : Number(price);
      }
      if (condition) {
        updateData.condition = mapConditionLabelToEnum(condition);
      }

      // Mise à jour de la catégorie si fournie
      if (category) {
        const categoryRecord = await prisma.category.upsert({
          where: { slug: category },
          update: {},
          create: { slug: category, name: category },
        });
        updateData.categoryId = categoryRecord.id;
      }

      // Mise à jour de la catégorie d'expédition
      if (shippingCategory !== undefined) {
        updateData.shippingCategory = shippingCategory || null;
      }
      // Mise à jour des dimensions personnalisées (uniquement pour CAT_VOLUMINEUX)
      if (customParcelLength !== undefined) {
        updateData.customParcelLength = customParcelLength ? Number(customParcelLength) : null;
      }
      if (customParcelWidth !== undefined) {
        updateData.customParcelWidth = customParcelWidth ? Number(customParcelWidth) : null;
      }
      if (customParcelHeight !== undefined) {
        updateData.customParcelHeight = customParcelHeight ? Number(customParcelHeight) : null;
      }
      if (customParcelWeight !== undefined) {
        updateData.customParcelWeight = customParcelWeight ? Number(customParcelWeight) : null;
      }

      // Mettre à jour le produit
      await prisma.product.update({
        where: { id },
        data: updateData,
      });

      // Mise à jour des images si fournies
      if (images.length > 0) {
        // Supprimer les anciennes images
        await prisma.productImage.deleteMany({
          where: { productId: id },
        });
        // Créer les nouvelles images
        await prisma.productImage.createMany({
          data: images.map((url: string, index: number) => ({
            productId: id,
            url,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      // Recharger avec les nouvelles images
      const productWithImages = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          category: true,
          seller: true,
        },
      });

      if (!productWithImages) {
        return res.status(500).json({ error: 'Failed to reload product after update' });
      }

      const mapped = mapDbProductToListingShape(productWithImages);
      return res.json(mapped);
    } catch (e) {
      console.error('[products] Failed to update product', e);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product (only by seller, before purchase)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Vérifier que le produit existe et appartient au vendeur
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true, parcelDimensions: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existingProduct.sellerId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    // Vérifier que le produit n'a pas été acheté
    if (existingProduct.paymentCompleted || existingProduct.status === 'SOLD') {
      return res.status(400).json({ error: 'Cannot delete a sold product' });
    }

    // Vérifier s'il y a une transaction en cours
    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        productId: id,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingTransaction) {
      return res.status(400).json({
        error: 'Cannot delete a product with a pending transaction'
      });
    }

    // Supprimer les favoris associés
    await prisma.favorite.deleteMany({
      where: { productId: id }
    });

    // Supprimer les images associées
    await prisma.productImage.deleteMany({
      where: { productId: id }
    });

    // Supprimer les dimensions du colis si présentes
    if (existingProduct.parcelDimensionsId) {
      // D'abord dissocier du produit
      await prisma.product.update({
        where: { id },
        data: { parcelDimensionsId: null }
      });
      // Puis supprimer les dimensions
      await prisma.parcelDimensions.delete({
        where: { id: existingProduct.parcelDimensionsId }
      });
    }

    // Supprimer le produit
    await prisma.product.delete({
      where: { id }
    });

    console.log(`[products] Product ${id} deleted by user ${userId}`);
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (e) {
    console.error('[products] Failed to delete product', e);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;