import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Seeded product identifiers
const SEEDED_PRODUCT_SLUGS = [
  'ak-74-kalashnikov-replique',
  'red-dot-sight-eotech-552',
  'gilet-tactique-multicam',
  'billes-0-25g-bio-5000pcs',
  'm4a1-custom-build',
  'chargeur-m4-120-billes'
];

const SEEDED_USER_EMAILS = [
  'vendeur@gearted.com',
  'tactical@gearted.com',
  'milsim@gearted.com'
];

// GET /api/admin/products/analyze - Analyze products in database
router.get('/products/analyze', authenticate, async (req, res) => {
  try {
    // Only allow admins
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allProducts = await prisma.product.findMany({
      include: {
        seller: {
          select: {
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const seededProducts = allProducts.filter(p =>
      SEEDED_PRODUCT_SLUGS.includes(p.slug) ||
      SEEDED_USER_EMAILS.includes(p.seller.email)
    );

    const realProducts = allProducts.filter(p =>
      !SEEDED_PRODUCT_SLUGS.includes(p.slug) &&
      !SEEDED_USER_EMAILS.includes(p.seller.email)
    );

    return res.json({
      total: allProducts.length,
      seeded: {
        count: seededProducts.length,
        products: seededProducts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          seller: p.seller.username,
          sellerEmail: p.seller.email,
          createdAt: p.createdAt
        }))
      },
      real: {
        count: realProducts.length,
        products: realProducts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title,
          seller: p.seller.username,
          createdAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('[admin] Failed to analyze products', error);
    return res.status(500).json({ error: 'Failed to analyze products' });
  }
});

// DELETE /api/admin/products/cleanup - Delete seeded products
router.delete('/products/cleanup', authenticate, async (req, res) => {
  try {
    // Only allow admins
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Delete products by seeded users
    const deletedByUser = await prisma.product.deleteMany({
      where: {
        seller: {
          email: {
            in: SEEDED_USER_EMAILS
          }
        }
      }
    });

    // Delete products by slug (in case they were created by different users)
    const deletedBySlug = await prisma.product.deleteMany({
      where: {
        slug: {
          in: SEEDED_PRODUCT_SLUGS
        }
      }
    });

    // Optionally delete the seeded users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: SEEDED_USER_EMAILS
        }
      }
    });

    const remainingProducts = await prisma.product.count();

    return res.json({
      success: true,
      deleted: {
        productsByUser: deletedByUser.count,
        productsBySlug: deletedBySlug.count,
        users: deletedUsers.count
      },
      remainingProducts
    });
  } catch (error) {
    console.error('[admin] Failed to cleanup products', error);
    return res.status(500).json({ error: 'Failed to cleanup products' });
  }
});

export default router;
