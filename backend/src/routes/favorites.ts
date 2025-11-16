import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

function getUserId(req: any): string {
  // TODO: extract from auth middleware/session; using demo for now
  return 'demo-1';
}

// GET /api/favorites -> { productIds: string[] }
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ productIds: favorites.map((fav) => fav.productId) });
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

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ productIds: favorites.map((fav) => fav.productId) });
  } catch (error) {
    console.error('[favorites] Failed to toggle favorite', error);
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;
