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

export default router;
