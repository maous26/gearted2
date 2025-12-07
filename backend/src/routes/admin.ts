import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const prisma = new PrismaClient();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req: Request, res: Response, next: any): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
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
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'commissions' }
    });

    return res.json({
      success: true,
      settings: settings?.value || {
        buyerEnabled: true,
        buyerFeePercent: 5,
        buyerFeeMin: 0.50,
        sellerEnabled: true,
        sellerFeePercent: 8,
        sellerFeeMin: 0.50
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
    const { 
      buyerEnabled, 
      buyerFeePercent, 
      buyerFeeMin,
      sellerEnabled, 
      sellerFeePercent,
      sellerFeeMin
    } = req.body;

    // Get current settings to merge
    const current = await (prisma as any).platformSettings.findFirst({
      where: { key: 'commissions' }
    });
    
    const currentValue = current?.value || {};
    
    const newSettings = {
      buyerEnabled: buyerEnabled !== undefined ? buyerEnabled : (currentValue.buyerEnabled ?? true),
      buyerFeePercent: buyerFeePercent !== undefined ? buyerFeePercent : (currentValue.buyerFeePercent ?? 5),
      buyerFeeMin: buyerFeeMin !== undefined ? buyerFeeMin : (currentValue.buyerFeeMin ?? 0.50),
      sellerEnabled: sellerEnabled !== undefined ? sellerEnabled : (currentValue.sellerEnabled ?? true),
      sellerFeePercent: sellerFeePercent !== undefined ? sellerFeePercent : (currentValue.sellerFeePercent ?? 8),
      sellerFeeMin: sellerFeeMin !== undefined ? sellerFeeMin : (currentValue.sellerFeeMin ?? 0.50)
    };

    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'commissions' },
      update: { value: newSettings },
      create: { key: 'commissions', value: newSettings }
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

// GET /api/admin/transactions - Alias for logs/transactions (for admin console)
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        include: {
          buyer: { select: { id: true, username: true, email: true } },
          product: { select: { id: true, title: true, price: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transaction.count()
    ]);

    return res.json({
      success: true,
      transactions,
      total
    });
  } catch (error) {
    console.error('[admin] Failed to get transactions:', error);
    return res.status(500).json({ error: 'Failed to get transactions' });
  }
});

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
              products: true
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

// GET /api/admin/expert/settings - Get Gearted Expert settings (address, etc.)
router.get('/expert/settings', async (req, res) => {
  try {
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'expert_settings' }
    });

    const defaultSettings = {
      address: {
        name: 'Gearted - Service Expert',
        street: '',
        city: '',
        postalCode: '',
        country: 'FR',
        phone: '',
        email: 'expert@gearted.com'
      },
      enabled: true,
      price: 19.90
    };

    return res.json({
      success: true,
      settings: settings?.value || defaultSettings
    });
  } catch (error) {
    console.error('[admin] Failed to get expert settings:', error);
    return res.status(500).json({ error: 'Failed to get expert settings' });
  }
});

// PUT /api/admin/expert/settings - Update Gearted Expert settings
router.put('/expert/settings', async (req, res) => {
  try {
    const { address, enabled, price } = req.body;

    if (!address || !address.street || !address.city || !address.postalCode) {
      return res.status(400).json({ error: 'Adresse complete requise (street, city, postalCode)' });
    }

    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'expert_settings' },
      update: {
        value: { address, enabled, price }
      },
      create: {
        key: 'expert_settings',
        value: { address, enabled, price }
      }
    });

    return res.json({
      success: true,
      settings: settings.value
    });
  } catch (error) {
    console.error('[admin] Failed to update expert settings:', error);
    return res.status(500).json({ error: 'Failed to update expert settings' });
  }
});

// POST /api/admin/expert/create-test - Create a test expert service (for testing)
router.post('/expert/create-test', async (req, res) => {
  try {
    const { productId, buyerId } = req.body;

    if (!productId || !buyerId) {
      return res.status(400).json({ error: 'productId and buyerId are required' });
    }

    // Get product and seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create a test transaction (required for ExpertService)
    const productPrice = parseFloat(product.price.toString());
    const transaction = await (prisma as any).transaction.create({
      data: {
        productId,
        buyerId,
        amount: productPrice,
        platformFee: 0, // Test transaction - no fees
        sellerAmount: productPrice, // Seller gets full amount for test
        totalPaid: productPrice + 19.90, // Product + expert fee
        buyerFee: 0,
        sellerFee: 0,
        buyerFeePercent: 0,
        sellerFeePercent: 0,
        currency: 'EUR',
        status: 'SUCCEEDED',
        paymentIntentId: `pi_test_expert_${Date.now()}`,
        hasExpert: true,
        metadata: { testExpert: true }
      }
    });

    console.log(`[admin] Created test transaction: ${transaction.id}`);

    // Create expert service linked to transaction
    const expertService = await (prisma as any).expertService.create({
      data: {
        transactionId: transaction.id,
        status: 'PENDING', // Ready for seller to ship
        price: 19.90
      },
      include: {
        transaction: {
          include: { 
            buyer: true,
            product: {
              include: { seller: true, parcelDimensions: true }
            }
          }
        }
      }
    });

    console.log(`[admin] Created test expert service: ${expertService.id}`);

    return res.json({
      success: true,
      expertService,
      message: 'Test expert service created. Seller can now generate shipping label to Gearted.'
    });
  } catch (error) {
    console.error('[admin] Failed to create test expert service:', error);
    return res.status(500).json({ error: 'Failed to create test expert service', details: String(error) });
  }
});

// POST /api/admin/expert/:expertServiceId/generate-seller-label - Simulate seller generating label to Gearted
// This endpoint is for testing the Gearted address integration
router.post('/expert/:expertServiceId/generate-seller-label', async (req, res) => {
  try {
    const { expertServiceId } = req.params;
    const { carrierId } = req.body;

    // Get expert service
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id: expertServiceId },
      include: {
        transaction: {
          include: {
            product: {
              include: { seller: true, parcelDimensions: true }
            },
            buyer: true
          }
        }
      }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Expert service not found' });
    }

    // Check if label already exists
    if (expertService.sellerTrackingNumber) {
      return res.status(400).json({ 
        error: 'Label already generated',
        tracking: expertService.sellerTrackingNumber 
      });
    }

    // Get Gearted address from settings
    let geartedAddress;
    try {
      const settings = await (prisma as any).platformSettings.findFirst({
        where: { key: 'expert_settings' }
      });
      if (settings?.value?.address?.street) {
        geartedAddress = settings.value.address;
      }
    } catch (e) {
      console.warn('[admin] Could not fetch Gearted address from settings');
    }

    // Default address if not configured
    if (!geartedAddress) {
      geartedAddress = {
        name: 'Gearted Expert',
        street: '123 Rue de l\'Expertise',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR'
      };
    }

    // Generate tracking number
    const carrierPrefix = carrierId ? carrierId.toUpperCase().split('-')[0] : 'MR';
    const trackingNumber = `${carrierPrefix}-EXP-${Date.now().toString(36).toUpperCase()}`;

    // Update expert service
    const updated = await (prisma as any).expertService.update({
      where: { id: expertServiceId },
      data: {
        status: 'IN_TRANSIT_TO_GEARTED',
        sellerTrackingNumber: trackingNumber,
        sellerShippedAt: new Date()
      }
    });

    // Prepare seller info
    const seller = expertService.transaction.product.seller;
    const product = expertService.transaction.product;

    console.log(`[admin] Generated seller label for expert ${expertServiceId}`);
    console.log(`[admin] Destination: ${geartedAddress.name}, ${geartedAddress.street}, ${geartedAddress.postalCode} ${geartedAddress.city}`);

    return res.json({
      success: true,
      message: 'Étiquette générée avec succès',
      label: {
        trackingNumber,
        carrier: carrierPrefix,
        labelUrl: `https://labels.gearted.com/expert/${trackingNumber}.pdf`,
        // Origin: Seller address
        origin: {
          name: seller.username || seller.firstName || 'Vendeur',
          location: product.location || 'France'
        },
        // Destination: Gearted Expert Center
        destination: geartedAddress
      },
      expertService: {
        id: updated.id,
        status: updated.status,
        sellerTrackingNumber: updated.sellerTrackingNumber,
        sellerShippedAt: updated.sellerShippedAt
      }
    });
  } catch (error) {
    console.error('[admin] Failed to generate seller label:', error);
    return res.status(500).json({ error: 'Failed to generate label', details: String(error) });
  }
});

// POST /api/admin/expert/:expertServiceId/generate-buyer-label - Generate shipping label from Gearted to buyer
router.post('/expert/:expertServiceId/generate-buyer-label', async (req, res) => {
  try {
    const { expertServiceId } = req.params;
    const { carrierId, serviceType } = req.body; // e.g., 'mondial_relay', 'point_relais'

    // Get expert service with transaction and buyer info
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id: expertServiceId },
      include: {
        transaction: {
          include: {
            buyer: true,
            product: {
              include: {
                parcelDimensions: true
              }
            }
          }
        }
      }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert introuvable' });
    }

    if (expertService.status !== 'VERIFIED') {
      return res.status(400).json({ error: 'Le produit doit etre verifie avant de generer l\'etiquette' });
    }

    // Get Gearted address
    const settingsRecord = await (prisma as any).platformSettings.findFirst({
      where: { key: 'expert_settings' }
    });

    if (!settingsRecord?.value?.address?.street) {
      return res.status(400).json({ error: 'Adresse Gearted non configuree. Veuillez la configurer dans les parametres.' });
    }

    const geartedAddress = settingsRecord.value.address;
    const buyer = expertService.transaction.buyer;
    const dimensions = expertService.transaction.product.parcelDimensions;

    if (!buyer.address || !buyer.city || !buyer.postalCode) {
      return res.status(400).json({ error: 'Adresse de l\'acheteur incomplete' });
    }

    // Generate mock tracking number (in production, use real shipping API)
    const trackingNumber = `GE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const labelUrl = `https://gearted.com/labels/${trackingNumber}.pdf`;

    // Update expert service with buyer tracking
    await (prisma as any).expertService.update({
      where: { id: expertServiceId },
      data: {
        buyerTrackingNumber: trackingNumber,
        status: 'IN_TRANSIT_TO_BUYER',
        shippedToBuyerAt: new Date()
      }
    });

    // Update transaction
    await prisma.transaction.update({
      where: { id: expertService.transactionId },
      data: {
        trackingNumber,
        status: 'PROCESSING'
      }
    });

    // Notify buyer
    await NotificationController.createNotification({
      userId: buyer.id,
      title: '📦 Colis expedie !',
      message: `Votre article verifie "${expertService.transaction.product.title}" a ete expedie. Numero de suivi : ${trackingNumber}`,
      type: 'SHIPPING_UPDATE',
      data: {
        transactionId: expertService.transactionId,
        trackingNumber,
        labelUrl,
        step: 'SHIPPED_TO_BUYER'
      }
    });

    return res.json({
      success: true,
      label: {
        trackingNumber,
        labelUrl,
        carrier: carrierId || 'mondial_relay',
        serviceType: serviceType || 'point_relais',
        from: geartedAddress,
        to: {
          name: buyer.username,
          street: buyer.address,
          city: buyer.city,
          postalCode: buyer.postalCode,
          country: 'FR'
        },
        dimensions: dimensions ? {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          weight: dimensions.weight
        } : null
      }
    });
  } catch (error) {
    console.error('[admin] Failed to generate buyer label:', error);
    return res.status(500).json({ error: 'Failed to generate label' });
  }
});

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

// ==========================================
// EXPERT SERVICE ACTIONS
// ==========================================

// GET /api/admin/expert/:id/details - Get expert service details for label generation
router.get('/expert/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            buyer: {
              select: { 
                id: true, 
                username: true, 
                email: true, 
                firstName: true, 
                lastName: true,
                phone: true
              }
            },
            product: {
              select: { 
                id: true, 
                title: true, 
                images: true,
                parcelDimensions: true
              }
            },
            shippingAddress: true
          }
        }
      }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert introuvable' });
    }

    return res.json({
      success: true,
      service: expertService
    });
  } catch (error) {
    console.error('[admin] Failed to get expert service details:', error);
    return res.status(500).json({ error: 'Failed to get service details' });
  }
});

// POST /api/admin/expert/mark-received/:id - Mark item as received at Gearted
router.post('/expert/mark-received/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id },
      include: { transaction: true }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert introuvable' });
    }

    if (expertService.status !== 'SHIPPED_TO_GEARTED') {
      return res.status(400).json({ 
        error: `Action impossible: status actuel est ${expertService.status}, attendu SHIPPED_TO_GEARTED` 
      });
    }

    const updated = await (prisma as any).expertService.update({
      where: { id },
      data: {
        status: 'RECEIVED_BY_GEARTED',
        receivedAt: new Date()
      }
    });

    return res.json({ 
      success: true, 
      message: 'Article marque comme recu',
      expertService: updated 
    });
  } catch (error) {
    console.error('[admin] Failed to mark received:', error);
    return res.status(500).json({ error: 'Failed to mark received' });
  }
});

// POST /api/admin/expert/verify/:id - Mark item as verified
router.post('/expert/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes, verificationPassed } = req.body;
    
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert introuvable' });
    }

    if (expertService.status !== 'RECEIVED_BY_GEARTED') {
      return res.status(400).json({ 
        error: `Action impossible: status actuel est ${expertService.status}, attendu RECEIVED_BY_GEARTED` 
      });
    }

    const updated = await (prisma as any).expertService.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationNotes: verificationNotes || 'Verification effectuee',
        verificationPassed: verificationPassed !== false
      }
    });

    return res.json({ 
      success: true, 
      message: 'Article verifie',
      expertService: updated 
    });
  } catch (error) {
    console.error('[admin] Failed to verify:', error);
    return res.status(500).json({ error: 'Failed to verify' });
  }
});

// POST /api/admin/expert/mark-delivered/:id - Mark item as delivered to buyer
router.post('/expert/mark-delivered/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const expertService = await (prisma as any).expertService.findUnique({
      where: { id },
      include: { transaction: true }
    });

    if (!expertService) {
      return res.status(404).json({ error: 'Service Expert introuvable' });
    }

    if (expertService.status !== 'SHIPPED_TO_BUYER') {
      return res.status(400).json({ 
        error: `Action impossible: status actuel est ${expertService.status}, attendu SHIPPED_TO_BUYER` 
      });
    }

    // Update expert service
    const updated = await (prisma as any).expertService.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      }
    });

    // Complete the transaction
    await prisma.transaction.update({
      where: { id: expertService.transactionId },
      data: {
        status: 'SUCCEEDED'
      }
    });

    return res.json({ 
      success: true, 
      message: 'Article livre, transaction completee',
      expertService: updated 
    });
  } catch (error) {
    console.error('[admin] Failed to mark delivered:', error);
    return res.status(500).json({ error: 'Failed to mark delivered' });
  }
});

// ==========================================
// DASHBOARD STATS
// ==========================================

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalTransactions,
      pendingExpertServices,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.transaction.count(),
      (prisma as any).expertService?.count({ where: { status: { not: 'DELIVERED' } } }).catch(() => 0) || 0,
      prisma.transaction.aggregate({
        _sum: { platformFee: true },
        where: { status: 'SUCCEEDED' }
      })
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalTransactions,
        pendingExpertServices,
        totalRevenue: totalRevenue._sum?.platformFee || 0
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get stats:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==========================================
// PLATFORM SETTINGS (Boost, Latest Section, etc.)
// ==========================================

// GET /api/admin/settings - Get all platform settings
router.get('/settings', async (req, res) => {
  try {
    const boostSettings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'boost_settings' }
    });

    const latestSectionSettings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'latest_section_settings' }
    });

    const defaultBoost = { enabled: true, price: 2.99 };
    const defaultLatest = { visible: true };

    return res.json({
      success: true,
      settings: {
        boost: boostSettings?.value || defaultBoost,
        latestSection: latestSectionSettings?.value || defaultLatest
      }
    });
  } catch (error) {
    console.error('[admin] Failed to get settings:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

// POST /api/admin/settings/boost - Toggle boost feature
router.post('/settings/boost', async (req, res) => {
  try {
    const { enabled, price } = req.body;

    const currentSettings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'boost_settings' }
    });

    const newSettings = {
      enabled: enabled !== undefined ? enabled : (currentSettings?.value?.enabled ?? true),
      price: price !== undefined ? price : (currentSettings?.value?.price ?? 2.99)
    };

    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'boost_settings' },
      update: { value: newSettings },
      create: { key: 'boost_settings', value: newSettings }
    });

    return res.json({
      success: true,
      message: `Boost ${newSettings.enabled ? 'active' : 'desactive'}`,
      settings: settings.value
    });
  } catch (error) {
    console.error('[admin] Failed to update boost settings:', error);
    return res.status(500).json({ error: 'Failed to update boost settings' });
  }
});

// POST /api/admin/settings/latest-section - Toggle latest section visibility
router.post('/settings/latest-section', async (req, res) => {
  try {
    const { visible } = req.body;

    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'latest_section_settings' },
      update: { value: { visible: visible !== false } },
      create: { key: 'latest_section_settings', value: { visible: visible !== false } }
    });

    return res.json({
      success: true,
      message: `Section "Derniers articles" ${settings.value.visible ? 'visible' : 'masquee'}`,
      settings: settings.value
    });
  } catch (error) {
    console.error('[admin] Failed to update latest section settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==========================================
// ASSURANCE PROTECTION (Casse/Perte)
// ==========================================

// GET /api/admin/settings/protection - Get protection/insurance settings
router.get('/settings/protection', async (req, res) => {
  try {
    const settings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'protection_settings' }
    });

    const defaultSettings = {
      enabled: true,
      price: 4.99,
      maxCoverage: 500,
      franchise: 50,
      maxClaimsPerYear: 2
    };

    return res.json({
      success: true,
      settings: settings?.value || defaultSettings
    });
  } catch (error) {
    console.error('[admin] Failed to get protection settings:', error);
    return res.status(500).json({ error: 'Failed to get protection settings' });
  }
});

// POST /api/admin/settings/protection - Toggle protection/insurance feature
router.post('/settings/protection', async (req, res) => {
  try {
    const { enabled, price, maxCoverage, franchise, maxClaimsPerYear } = req.body;

    const currentSettings = await (prisma as any).platformSettings.findFirst({
      where: { key: 'protection_settings' }
    });

    const currentValue = currentSettings?.value || {};

    const newSettings = {
      enabled: enabled !== undefined ? enabled : (currentValue.enabled ?? true),
      price: price !== undefined ? price : (currentValue.price ?? 4.99),
      maxCoverage: maxCoverage !== undefined ? maxCoverage : (currentValue.maxCoverage ?? 500),
      franchise: franchise !== undefined ? franchise : (currentValue.franchise ?? 50),
      maxClaimsPerYear: maxClaimsPerYear !== undefined ? maxClaimsPerYear : (currentValue.maxClaimsPerYear ?? 2)
    };

    const settings = await (prisma as any).platformSettings.upsert({
      where: { key: 'protection_settings' },
      update: { value: newSettings },
      create: { key: 'protection_settings', value: newSettings }
    });

    return res.json({
      success: true,
      message: `Assurance Protection ${newSettings.enabled ? 'activee' : 'desactivee'}`,
      settings: settings.value
    });
  } catch (error) {
    console.error('[admin] Failed to update protection settings:', error);
    return res.status(500).json({ error: 'Failed to update protection settings' });
  }
});

export default router;
