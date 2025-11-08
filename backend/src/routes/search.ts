import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Search for products/parts by name or reference
router.get('/items', async (req, res): Promise<any> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({ 
        error: 'Query must be at least 2 characters' 
      });
    }

    // Search in weapon models
    const weapons = await prisma.weaponModel.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { model: { contains: query } },
        ],
        isActive: true,
      },
      include: {
        manufacturer: true,
      },
      take: 10,
    });

    // Search in parts
    const parts = await prisma.part.findMany({
      where: {
        name: { contains: query },
        isActive: true,
      },
      take: 10,
    });

    // Format results
    const results = [
      ...weapons.map(w => ({
        id: w.id,
        name: w.name,
        type: 'WEAPON',
        subType: w.weaponType,
        manufacturer: w.manufacturer.name,
        reference: w.model,
        specs: {
          gearboxType: w.gearboxType,
          hopUpType: w.hopUpType,
          barrelLength: w.barrelLength,
        }
      })),
      ...parts.map(p => ({
        id: p.id,
        name: p.name,
        type: 'PART',
        subType: p.partType,
        manufacturer: p.manufacturer,
        reference: p.name,
        price: p.price,
      }))
    ];

    return res.json(results);

  } catch (error) {
    console.error('Error searching items:', error);
    return res.status(500).json({ error: 'Failed to search items' });
  }
});

// Check compatibility between two specific items
router.get('/compatibility/:item1Id/:item2Id', async (req, res): Promise<any> => {
  try {
    const { item1Id, item2Id } = req.params;

    // Get both items
    const [weapon1, weapon2, part1, part2] = await Promise.all([
      prisma.weaponModel.findUnique({ where: { id: item1Id }, include: { manufacturer: true } }),
      prisma.weaponModel.findUnique({ where: { id: item2Id }, include: { manufacturer: true } }),
      prisma.part.findUnique({ where: { id: item1Id } }),
      prisma.part.findUnique({ where: { id: item2Id } }),
    ]);

    const item1 = weapon1 || part1;
    const item2 = weapon2 || part2;

    if (!item1 || !item2) {
      return res.status(404).json({ error: 'One or both items not found' });
    }

    // Check if we have a weapon and a part
    let compatibilityInfo = null;

    if (weapon1 && part2) {
      // Check weapon1 with part2
      compatibilityInfo = await prisma.partCompatibility.findUnique({
        where: {
          weaponModelId_partId: {
            weaponModelId: weapon1.id,
            partId: part2.id,
          },
        },
      });
    } else if (weapon2 && part1) {
      // Check weapon2 with part1
      compatibilityInfo = await prisma.partCompatibility.findUnique({
        where: {
          weaponModelId_partId: {
            weaponModelId: weapon2.id,
            partId: part1.id,
          },
        },
      });
    }

    if (!compatibilityInfo) {
      return res.json({
        compatible: false,
        verified: false,
        message: 'Aucune donnée de compatibilité vérifiée disponible pour cette combinaison.',
        recommendation: 'Nous vous recommandons de vérifier auprès du fabricant ou de la communauté avant l\'achat.'
      });
    }

    return res.json({
      compatible: compatibilityInfo.compatibilityScore >= 95, // Only show as compatible if 95%+
      verified: true,
      score: compatibilityInfo.compatibilityScore,
      requiresModification: compatibilityInfo.requiresModification,
      notes: compatibilityInfo.notes,
      message: compatibilityInfo.compatibilityScore >= 95 
        ? '✓ Compatibilité vérifiée' 
        : compatibilityInfo.compatibilityScore >= 85
        ? '⚠️ Compatible avec modifications mineures'
        : '✗ Non compatible - modifications majeures requises',
    });

  } catch (error) {
    console.error('Error checking compatibility:', error);
    return res.status(500).json({ error: 'Failed to check compatibility' });
  }
});

export default router;
