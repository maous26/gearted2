import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const prisma = new PrismaClient();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req: Request, res: Response, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Appliquer authentication + admin check à toutes les routes
router.use(authenticate);
router.use(requireAdmin);

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

// ==========================================
// GESTION DES PRODUITS
// ==========================================

// GET /api/admin/products/analyze - Analyze products in database
router.get('/products/analyze', async (req, res) => {
  try {

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
router.delete('/products/cleanup', async (req, res) => {
  try {

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

// ==========================================
// GESTION DES COMMISSIONS
// ==========================================

// GET /api/admin/commissions/settings - Get commission settings
router.get('/commissions/settings', async (req, res) => {
  try {
    // Récupérer les paramètres globaux (à stocker dans une table Settings)
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'commissions' }
    });

    return res.json({
      success: true,
      settings: settings?.value || {
        enabled: true,
        buyerFeePercent: 5,
        sellerFeePercent: 5
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get commission settings:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/admin/commissions/settings - Update commission settings
router.put('/commissions/settings', async (req, res) => {
  try {
    const { enabled, buyerFeePercent, sellerFeePercent } = req.body;

    // Upsert settings
    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'commissions' },
      update: {
        value: { enabled, buyerFeePercent, sellerFeePercent }
      },
      create: {
        key: 'commissions',
        value: { enabled, buyerFeePercent, sellerFeePercent }
      }
    });

    return res.json({
      success: true,
      settings: settings.value
    });
  } catch (error) {
    console.error('[admin] Failed to update commission settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// PUT /api/admin/users/:userId/commissions - Toggle commissions for specific user
router.put('/users/:userId/commissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { exemptFromCommissions } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { exemptFromCommissions: exemptFromCommissions } as any
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        exemptFromCommissions: (user as any).exemptFromCommissions
      }
    });
  } catch (error) {
    console.error('[admin] Failed to update user commissions:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==========================================
// GESTION PREMIUM
// ==========================================

// PUT /api/admin/users/:userId/premium - Give/remove premium access
router.put('/users/:userId/premium', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium, premiumUntil } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium,
        premiumUntil: premiumUntil ? new Date(premiumUntil) : null
      } as any
    });

    // Notifier l'utilisateur
    await NotificationController.createNotification({
      userId,
      title: isPremium ? '⭐ Premium activé !' : 'Premium désactivé',
      message: isPremium
        ? `Félicitations ! Votre compte Premium a été activé${premiumUntil ? ` jusqu'au ${new Date(premiumUntil).toLocaleDateString()}` : ' de façon permanente'}.`
        : 'Votre accès Premium a été désactivé.',
      type: isPremium ? 'SUCCESS' : 'INFO',
      data: { isPremium, premiumUntil }
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isPremium: (user as any).isPremium,
        premiumUntil: (user as any).premiumUntil
      }
    });
  } catch (error) {
    console.error('[admin] Failed to update premium status:', error);
    return res.status(500).json({ error: 'Failed to update premium' });
  }
});

// ==========================================
// MESSAGERIE ADMIN
// ==========================================

// POST /api/admin/messages/broadcast - Send message to all users
router.post('/messages/broadcast', async (req, res) => {
  try {
    const { title, message, targetUserIds } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message required' });
    }

    // Si targetUserIds est fourni, envoyer uniquement à ces utilisateurs
    const users = targetUserIds && targetUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: targetUserIds } } })
      : await prisma.user.findMany();

    // Créer notifications pour tous les utilisateurs
    let successCount = 0;
    for (const user of users) {
      try {
        await NotificationController.createNotification({
          userId: user.id,
          title,
          message,
          type: 'INFO',
          data: { source: 'admin_broadcast' }
        });
        successCount++;
      } catch (error) {
        console.error(`[admin] Failed to send to user ${user.id}:`, error);
      }
    }

    return res.json({
      success: true,
      sentTo: successCount,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('[admin] Failed to broadcast message:', error);
    return res.status(500).json({ error: 'Failed to send messages' });
  }
});

// POST /api/admin/messages/user - Send message to specific user
router.post('/messages/user', async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title and message required' });
    }

    await NotificationController.createNotification({
      userId,
      title,
      message,
      type: 'INFO',
      data: { source: 'admin_direct' }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[admin] Failed to send message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// LOGS ACHATS/VENTES
// ==========================================

// GET /api/admin/logs/transactions - Get all transactions
router.get('/logs/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, userId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (userId) {
      where.OR = [
        { buyerId: userId },
        { product: { sellerId: userId } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              seller: {
                select: { id: true, username: true, email: true }
              }
            }
          },
          buyer: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({
      success: true,
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get transactions:', error);
    return res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// GET /api/admin/logs/sales - Get sales statistics
router.get('/logs/sales', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'SUCCEEDED' },
      select: {
        amount: true,
        platformFee: true,
        createdAt: true
      }
    });

    const totalSales = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + Number((t as any).platformFee || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalTransactions: transactions.length,
        totalSales,
        totalCommissions,
        averageOrderValue: transactions.length > 0 ? totalSales / transactions.length : 0
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get sales stats:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              products: true,
              purchases: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      success: true,
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get users:', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

// ==========================================
// GESTION DES PUBLICITÉS
// ==========================================

// GET /api/admin/advertisements - Get all advertisements
router.get('/advertisements', async (req, res) => {
  try {
    const ads = await (prisma as any).advertisement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, advertisements: ads });
  } catch (error) {
    console.error('[admin] Failed to get advertisements:', error);
    return res.status(500).json({ error: 'Failed to get advertisements' });
  }
});

// POST /api/admin/advertisements - Create advertisement
router.post('/advertisements', async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      link,
      placement, // 'home', 'landing', 'sidebar', 'banner'
      isActive,
      startDate,
      endDate
    } = req.body;

    if (!title || !imageUrl || !placement) {
      return res.status(400).json({ error: 'title, imageUrl and placement required' });
    }

    const ad = await (prisma as any).advertisement.create({
      data: {
        title,
        description,
        imageUrl,
        link,
        placement,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      }
    });

    return res.json({ success: true, advertisement: ad });
  } catch (error) {
    console.error('[admin] Failed to create advertisement:', error);
    return res.status(500).json({ error: 'Failed to create advertisement' });
  }
});

// PUT /api/admin/advertisements/:adId - Update advertisement
router.put('/advertisements/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { title, description, imageUrl, link, placement, isActive, startDate, endDate } = req.body;

    const ad = await (prisma as any).advertisement.update({
      where: { id: adId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl && { imageUrl }),
        ...(link !== undefined && { link }),
        ...(placement && { placement }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })
      }
    });

    return res.json({ success: true, advertisement: ad });
  } catch (error) {
    console.error('[admin] Failed to update advertisement:', error);
    return res.status(500).json({ error: 'Failed to update advertisement' });
  }
});

// DELETE /api/admin/advertisements/:adId - Delete advertisement
router.delete('/advertisements/:adId', async (req, res) => {
  try {
    const { adId } = req.params;

    await (prisma as any).advertisement.delete({
      where: { id: adId }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[admin] Failed to delete advertisement:', error);
    return res.status(500).json({ error: 'Failed to delete advertisement' });
  }
});

// ==========================================
// EXPERT SERVICE ADMIN (Gearted Verification)
// ==========================================
// Note: Les autres routes Expert sont dans /api/premium/admin/*
// Voir routes/premium.ts pour les fonctions:
// - POST /api/premium/admin/expert/:expertServiceId/received
// - POST /api/premium/admin/expert/:expertServiceId/verify
// - POST /api/premium/admin/expert/:expertServiceId/ship-to-buyer
// - POST /api/premium/admin/expert/:expertServiceId/delivered
// - GET /api/premium/admin/expert/pending

// GET /api/admin/expert/all - Get all expert services with filters
router.get('/expert/all', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;

    const [services, total] = await Promise.all([
      (prisma as any).expertService.findMany({
        where,
        include: {
          transaction: {
            include: {
              product: {
                select: { id: true, title: true, images: true }
              },
              buyer: {
                select: { id: true, username: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      (prisma as any).expertService.count({ where })
    ]);

    return res.json({
      success: true,
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get expert services:', error);
    return res.status(500).json({ error: 'Failed to get services' });
  }
});

export default router;
