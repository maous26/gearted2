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

export default router;
