import { Favorite, PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { findMockProductById } from '../mockData/products';

const router = Router();
const prisma = new PrismaClient();

function getUserId(req: any): string {
  // TODO: extract from auth middleware/session; using demo for now
  return 'demo-1';
}

function mapFavoriteToProduct(favorite: Favorite) {
  const mockProduct = findMockProductById(favorite.productId);

  if (mockProduct) {
    return mockProduct;
  }

  return {
    id: favorite.productId,
    title: `Produit #${favorite.productId}`,
    price: 0,
    condition: 'Indisponible',
    location: 'Non spécifié',
    seller: 'Inconnu',
    sellerId: favorite.userId,
    rating: 0,
    images: ['https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=Produit'],
    category: 'divers',
    featured: false,
    createdAt: favorite.createdAt instanceof Date ? favorite.createdAt.toISOString() : favorite.createdAt,
    description: '',
    listingType: 'SALE',
    tradeFor: undefined,
    handDelivery: false,
  };
}

async function buildFavoritesResponse(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    productIds: favorites.map((fav) => fav.productId),
    products: favorites.map(mapFavoriteToProduct),
  };
}

// GET /api/favorites -> { productIds: string[] }
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  try {
    const payload = await buildFavoritesResponse(userId);
    return res.json(payload);
  } catch (error) {
    console.error('[favorites] Failed to fetch favorites', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites/:productId/toggle
router.post('/:productId/toggle', async (req, res) => {
  const userId = getUserId(req);
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
    } else {
      await prisma.favorite.create({
        data: {
        userId,
        productId,
        },
      });
    }

    const payload = await buildFavoritesResponse(userId);
    return res.json(payload);
  } catch (error) {
    console.error('[favorites] Failed to toggle favorite', error);
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;
