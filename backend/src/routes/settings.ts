import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Public settings - accessible without authentication
// Only exposes non-sensitive configuration needed by the frontend
router.get('/public', async (_req, res) => {
  try {
    // Get boost settings
    const boostSettings = await (prisma as any).platformSettings?.findUnique({
      where: { key: 'boost_settings' }
    });

    // Get latest section settings
    const latestSectionSettings = await (prisma as any).platformSettings?.findUnique({
      where: { key: 'latest_section_settings' }
    });

    const boost = boostSettings?.value || { enabled: false };
    const latestSection = latestSectionSettings?.value || { visible: false };

    // Return only public settings
    res.json({
      boost: {
        enabled: boost.enabled ?? false,
        showLatestSection: latestSection.visible ?? false,
      },
    });
  } catch (error) {
    console.error('[settings] Failed to get public settings', error);
    // Return default values on error
    res.json({
      boost: {
        enabled: false,
        showLatestSection: false,
      },
    });
  }
});

// Public commission settings - needed by frontend for price display
router.get('/commissions', async (_req, res) => {
  try {
    const settings = await (prisma as any).platformSettings?.findFirst({
      where: { key: 'commissions' }
    });

    const commissions = settings?.value || {
      buyerEnabled: true,
      buyerFeePercent: 5,
      buyerFeeMin: 0.50,
      sellerEnabled: true,
      sellerFeePercent: 8,
      sellerFeeMin: 0.50
    };

    // Return only what the frontend needs (no sensitive info)
    res.json({
      success: true,
      settings: {
        buyerEnabled: commissions.buyerEnabled ?? true,
        buyerFeePercent: commissions.buyerFeePercent ?? 5,
        sellerEnabled: commissions.sellerEnabled ?? true,
        sellerFeePercent: commissions.sellerFeePercent ?? 8
      }
    });
  } catch (error) {
    console.error('[settings] Failed to get commission settings', error);
    res.json({
      success: true,
      settings: {
        buyerEnabled: true,
        buyerFeePercent: 5,
        sellerEnabled: true,
        sellerFeePercent: 8
      }
    });
  }
});

// Public advertisements - for banners and promotional content
router.get('/advertisements', async (req, res) => {
  try {
    const { placement } = req.query;
    const now = new Date();

    // Build where clause
    const whereClause: any = {
      isActive: true,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } }
      ]
    };

    // Filter by placement if provided
    if (placement && typeof placement === 'string') {
      whereClause.placement = placement;
    }

    const advertisements = await (prisma as any).advertisement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // Increment impressions for each ad returned
    if (advertisements.length > 0) {
      await (prisma as any).advertisement.updateMany({
        where: { id: { in: advertisements.map((ad: any) => ad.id) } },
        data: { impressions: { increment: 1 } }
      });
    }

    res.json({
      success: true,
      advertisements
    });
  } catch (error) {
    console.error('[settings] Failed to get advertisements', error);
    res.json({
      success: true,
      advertisements: []
    });
  }
});

// Track advertisement click
router.post('/advertisements/:adId/click', async (req, res) => {
  try {
    const { adId } = req.params;

    await (prisma as any).advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[settings] Failed to track ad click', error);
    res.json({ success: false });
  }
});

// Public promo banner settings - for home page banner
router.get('/promo-banner', async (_req, res) => {
  try {
    const settings = await (prisma as any).platformSettings?.findFirst({
      where: { key: 'promo_banner' }
    });

    const banner = settings?.value || {
      enabled: false,
      message: '',
      backgroundColor: '#FFB800',
      textColor: '#000000',
      fontFamily: 'default',
      effect: 'none'
    };

    res.json({
      success: true,
      banner: {
        enabled: banner.enabled ?? false,
        message: banner.message ?? '',
        backgroundColor: banner.backgroundColor ?? '#FFB800',
        textColor: banner.textColor ?? '#000000',
        fontFamily: banner.fontFamily ?? 'default',
        effect: banner.effect ?? 'none'
      }
    });
  } catch (error) {
    console.error('[settings] Failed to get promo banner settings', error);
    res.json({
      success: true,
      banner: {
        enabled: false,
        message: '',
        backgroundColor: '#FFB800',
        textColor: '#000000',
        fontFamily: 'default',
        effect: 'none'
      }
    });
  }
});

// Public protection/insurance settings - needed by frontend to show/hide option
router.get('/protection', async (_req, res) => {
  try {
    const settings = await (prisma as any).platformSettings?.findFirst({
      where: { key: 'protection_settings' }
    });

    const protection = settings?.value || {
      enabled: true,
      price: 4.99
    };

    // Return only what the frontend needs
    res.json({
      success: true,
      settings: {
        enabled: protection.enabled ?? true,
        price: protection.price ?? 4.99
      }
    });
  } catch (error) {
    console.error('[settings] Failed to get protection settings', error);
    res.json({
      success: true,
      settings: {
        enabled: true,
        price: 4.99
      }
    });
  }
});

export default router;
