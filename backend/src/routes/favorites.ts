import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/favorites -> { productIds: string[] }
router.get('/', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('[favorites] Failed to fetch favorites', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites/:productId/toggle
router.post('/:productId/toggle', async (req: Request, res: Response) => {
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
