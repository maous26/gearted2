import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all manufacturers
router.get('/manufacturers', async (req, res) => {
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      where: { isActive: true },
      orderBy: { popularity: 'desc' },
      take: 20, // Top 20
    });

    res.json(manufacturers);
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    res.status(500).json({ error: 'Failed to fetch manufacturers' });
  }
});

// Get weapon types (enum values)
router.get('/weapon-types', async (req, res) => {
  try {
    // Return weapon types from our enum
    const weaponTypes = [
      { value: 'ASSAULT_RIFLE', label: 'Assault Rifle' },
      { value: 'SMG', label: 'SMG' },
      { value: 'SNIPER_RIFLE', label: 'Sniper Rifle' },
      { value: 'PISTOL', label: 'Pistol' },
      { value: 'LMG', label: 'LMG' },
      { value: 'SHOTGUN', label: 'Shotgun' },
      { value: 'DMR', label: 'DMR' },
      { value: 'CARBINE', label: 'Carbine' },
    ];

    res.json(weaponTypes);
  } catch (error) {
    console.error('Error fetching weapon types:', error);
    res.status(500).json({ error: 'Failed to fetch weapon types' });
  }
});

// Get weapon models by manufacturer and type
router.get('/weapon-models', async (req, res) => {
  try {
    const { manufacturerId, weaponType } = req.query;

    const weaponModels = await prisma.weaponModel.findMany({
      where: {
        ...(manufacturerId && { manufacturerId: manufacturerId as string }),
        ...(weaponType && { weaponType: weaponType as any }),
        isActive: true,
      },
      include: {
        manufacturer: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(weaponModels);
  } catch (error) {
    console.error('Error fetching weapon models:', error);
    res.status(500).json({ error: 'Failed to fetch weapon models' });
  }
});

// Check compatibility for a weapon
router.get('/check', async (req, res): Promise<any> => {
  try {
    const { manufacturerName, weaponType } = req.query;

    if (!manufacturerName || !weaponType) {
      return res.status(400).json({ 
        error: 'Both manufacturerName and weaponType are required' 
      });
    }

    // Find manufacturer
    const manufacturer = await prisma.manufacturer.findFirst({
      where: { 
        name: manufacturerName as string,
        isActive: true,
      },
    });

    if (!manufacturer) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }

    // Find weapon models
    const weaponModels = await prisma.weaponModel.findMany({
      where: {
        manufacturerId: manufacturer.id,
        weaponType: weaponType as any,
        isActive: true,
      },
      include: {
        compatibleParts: {
          include: {
            part: true,
          },
          orderBy: {
            compatibilityScore: 'desc',
          },
        },
      },
    });

    if (weaponModels.length === 0) {
      // Return generic compatibility based on manufacturer
      const allParts = await prisma.part.findMany({
        where: { isActive: true },
        take: 20,
      });

      return res.json({
        manufacturer: manufacturer.name,
        weaponType,
        hasSpecificModel: false,
        compatibility: {
          'Magazines': allParts.filter(p => p.partType === 'MAGAZINE').slice(0, 5).map(p => ({
            name: p.name,
            manufacturer: p.manufacturer,
            compatibility: '85%',
            price: p.price ? `$${p.price}` : 'N/A',
            partId: p.id,
          })),
          'Barrels': allParts.filter(p => p.partType === 'BARREL').slice(0, 5).map(p => ({
            name: p.name,
            manufacturer: p.manufacturer,
            compatibility: '90%',
            price: p.price ? `$${p.price}` : 'N/A',
            partId: p.id,
          })),
          'Hop-up Units': allParts.filter(p => p.partType === 'HOP_UP').slice(0, 5).map(p => ({
            name: p.name,
            manufacturer: p.manufacturer,
            compatibility: '85%',
            price: p.price ? `$${p.price}` : 'N/A',
            partId: p.id,
          })),
        },
      });
    }

    // Use the first model's compatibility data (or we could aggregate across models)
    const weaponModel = weaponModels[0];
    
    // Group parts by type
    const compatibilityByCategory: Record<string, any[]> = {};
    
    for (const compat of weaponModel.compatibleParts) {
      const categoryName = formatPartType(compat.part.partType);
      
      if (!compatibilityByCategory[categoryName]) {
        compatibilityByCategory[categoryName] = [];
      }

      compatibilityByCategory[categoryName].push({
        name: compat.part.name,
        manufacturer: compat.part.manufacturer,
        compatibility: `${compat.compatibilityScore}%`,
        price: compat.part.price ? `$${compat.part.price}` : 'N/A',
        partId: compat.part.id,
        requiresModification: compat.requiresModification,
        notes: compat.notes,
      });
    }

    return res.json({
      manufacturer: manufacturer.name,
      weaponType,
      weaponModel: weaponModel.name,
      hasSpecificModel: true,
      compatibility: compatibilityByCategory,
    });

  } catch (error) {
    console.error('Error checking compatibility:', error);
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
});

// Helper function to format part type enum to readable string
function formatPartType(partType: string): string {
  const typeMap: Record<string, string> = {
    'MAGAZINE': 'Magazines',
    'BARREL': 'Barrels',
    'HOP_UP': 'Hop-up Units',
    'GEARBOX': 'Gearboxes',
    'MOTOR': 'Motors',
    'BATTERY': 'Batteries',
    'OPTIC': 'Optics',
    'STOCK': 'Stocks',
    'GRIP': 'Grips',
    'SUPPRESSOR': 'Suppressors',
    'RAIL_SYSTEM': 'Rail Systems',
  };

  return typeMap[partType] || partType;
}

export default router;