import { PartType, PrismaClient, WeaponType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Top 20 Airsoft Manufacturers
  const manufacturers = [
    { name: 'Tokyo Marui', country: 'Japan', popularity: 100, description: 'Industry leader in airsoft, known for quality and innovation' },
    { name: 'KWA', country: 'Taiwan', popularity: 95, description: 'High-quality gas blowback and AEG manufacturer' },
    { name: 'VFC', country: 'Taiwan', popularity: 92, description: 'Umarex licensed products and quality replicas' },
    { name: 'G&G Armament', country: 'Taiwan', popularity: 90, description: 'Reliable AEGs with excellent value' },
    { name: 'Krytac', country: 'USA', popularity: 88, description: 'Premium AEGs with exceptional build quality' },
    { name: 'Classic Army', country: 'Hong Kong', popularity: 85, description: 'Long-standing manufacturer with diverse lineup' },
    { name: 'ICS', country: 'Taiwan', popularity: 83, description: 'Split gearbox design and quality internals' },
    { name: 'ASG', country: 'Denmark', popularity: 80, description: 'Wide range of licensed products' },
    { name: 'Cybergun', country: 'France', popularity: 78, description: 'Licensed replicas and FPS products' },
    { name: 'Elite Force', country: 'USA', popularity: 76, description: 'Umarex brand with licensed H&K replicas' },
    { name: 'LCT Airsoft', country: 'China', popularity: 74, description: 'Excellent AK platform replicas' },
    { name: 'E&L', country: 'China', popularity: 72, description: 'High-quality AK replicas with steel construction' },
    { name: 'ARES', country: 'Hong Kong', popularity: 70, description: 'Electronic fire control systems' },
    { name: 'King Arms', country: 'Hong Kong', popularity: 68, description: 'Licensed M4 and other platforms' },
    { name: 'A&K', country: 'China', popularity: 65, description: 'Support weapons and budget-friendly options' },
    { name: 'WE Tech', country: 'Taiwan', popularity: 63, description: 'Gas blowback specialist' },
    { name: 'CYMA', country: 'China', popularity: 60, description: 'Budget-friendly AKs with good quality' },
    { name: 'Lancer Tactical', country: 'Taiwan', popularity: 58, description: 'Entry-level to mid-range AEGs' },
    { name: 'Valken', country: 'USA', popularity: 55, description: 'Complete airsoft solutions' },
    { name: 'Specna Arms', country: 'Poland', popularity: 53, description: 'European manufacturer with growing reputation' },
  ];

  console.log('📦 Creating manufacturers...');
  for (const mfg of manufacturers) {
    await prisma.manufacturer.upsert({
      where: { name: mfg.name },
      update: {},
      create: {
        name: mfg.name,
        slug: mfg.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
        country: mfg.country,
        popularity: mfg.popularity,
        description: mfg.description,
      },
    });
  }

  // Create popular weapon models
  console.log('🔫 Creating weapon models...');
  const weaponModels = [
    // Tokyo Marui Models
    { mfg: 'Tokyo Marui', model: 'M4A1 MWS', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'GBB', hopUpType: 'Adjustable' },
    { mfg: 'Tokyo Marui', model: 'AK47', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V3', hopUpType: 'Standard' },
    { mfg: 'Tokyo Marui', model: 'VSR-10', weaponType: WeaponType.SNIPER_RIFLE, gearboxType: 'Spring', hopUpType: 'Adjustable' },
    { mfg: 'Tokyo Marui', model: 'Hi-Capa 5.1', weaponType: WeaponType.PISTOL, gearboxType: 'GBB', hopUpType: 'Fixed' },
    
    // KWA Models
    { mfg: 'KWA', model: 'KM4A1', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V2', hopUpType: 'Adjustable' },
    { mfg: 'KWA', model: 'Ronin T6', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V2', hopUpType: 'Adjustable' },
    { mfg: 'KWA', model: 'ATP', weaponType: WeaponType.PISTOL, gearboxType: 'GBB', hopUpType: 'Fixed' },
    
    // VFC Models
    { mfg: 'VFC', model: 'Avalon', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V2', hopUpType: 'Rotary' },
    { mfg: 'VFC', model: 'HK416A5', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V2', hopUpType: 'Rotary' },
    
    // G&G Models
    { mfg: 'G&G Armament', model: 'CM16 Raider', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V2', hopUpType: 'Standard' },
    { mfg: 'G&G Armament', model: 'ARP9', weaponType: WeaponType.SMG, gearboxType: 'V2', hopUpType: 'Rotary' },
    
    // Krytac Models
    { mfg: 'Krytac', model: 'Trident MK2', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'Proprietary', hopUpType: 'Rotary' },
    { mfg: 'Krytac', model: 'Vector', weaponType: WeaponType.SMG, gearboxType: 'V2', hopUpType: 'Rotary' },
    
    // LCT Models
    { mfg: 'LCT Airsoft', model: 'AK-74M', weaponType: WeaponType.ASSAULT_RIFLE, gearboxType: 'V3', hopUpType: 'Standard' },
    { mfg: 'LCT Airsoft', model: 'RPK-16', weaponType: WeaponType.LMG, gearboxType: 'V3', hopUpType: 'Standard' },
  ];

  for (const weapon of weaponModels) {
    const manufacturer = await prisma.manufacturer.findFirst({
      where: { name: weapon.mfg },
    });

    if (manufacturer) {
      await prisma.weaponModel.upsert({
        where: {
          manufacturerId_model_version: {
            manufacturerId: manufacturer.id,
            model: weapon.model,
            version: '',
          },
        },
        update: {},
        create: {
          manufacturerId: manufacturer.id,
          name: `${weapon.mfg} ${weapon.model}`,
          model: weapon.model,
          weaponType: weapon.weaponType,
          gearboxType: weapon.gearboxType,
          hopUpType: weapon.hopUpType,
        },
      });
    }
  }

  // Create compatible parts
  console.log('🔧 Creating parts...');
  const parts = [
    // Magazines
    { name: 'Tokyo Marui 30rd Magazine', manufacturer: 'Tokyo Marui', type: PartType.MAGAZINE, price: 25 },
    { name: 'G&P 120rd Mid-Cap', manufacturer: 'G&P', type: PartType.MAGAZINE, price: 18 },
    { name: 'PTS EPM', manufacturer: 'PTS', type: PartType.MAGAZINE, price: 22 },
    { name: 'MAG 190rd Mid-Cap', manufacturer: 'MAG', type: PartType.MAGAZINE, price: 15 },
    { name: 'KWA K120 Mid-Cap', manufacturer: 'KWA', type: PartType.MAGAZINE, price: 20 },
    
    // Barrels
    { name: 'Prometheus 6.03mm Barrel', manufacturer: 'Prometheus', type: PartType.BARREL, price: 45 },
    { name: 'Lambda Five Barrel', manufacturer: 'Lambda', type: PartType.BARREL, price: 38 },
    { name: 'Madbull 6.01mm Barrel', manufacturer: 'Madbull', type: PartType.BARREL, price: 32 },
    { name: 'PDI 6.05mm Barrel', manufacturer: 'PDI', type: PartType.BARREL, price: 55 },
    { name: 'ZCI 6.02mm Barrel', manufacturer: 'ZCI', type: PartType.BARREL, price: 25 },
    
    // Hop-up Units
    { name: 'Maple Leaf Hop-up Chamber', manufacturer: 'Maple Leaf', type: PartType.HOP_UP, price: 35 },
    { name: 'G&G Green Hop-up', manufacturer: 'G&G', type: PartType.HOP_UP, price: 28 },
    { name: 'Lonex Hop-up Unit', manufacturer: 'Lonex', type: PartType.HOP_UP, price: 42 },
    { name: 'Prowin Hop-up Chamber', manufacturer: 'Prowin', type: PartType.HOP_UP, price: 38 },
    { name: 'Maxx Model Hop-up', manufacturer: 'Maxx', type: PartType.HOP_UP, price: 48 },
    
    // Motors
    { name: 'ASG Ultimate 30K Motor', manufacturer: 'ASG', type: PartType.MOTOR, price: 65 },
    { name: 'SHS High Torque Motor', manufacturer: 'SHS', type: PartType.MOTOR, price: 35 },
    { name: 'Tienly 25K Motor', manufacturer: 'Tienly', type: PartType.MOTOR, price: 85 },
    
    // Optics
    { name: 'Vortex Red Dot', manufacturer: 'Vortex', type: PartType.OPTIC, price: 120 },
    { name: 'Holosun 503', manufacturer: 'Holosun', type: PartType.OPTIC, price: 180 },
  ];

  for (const part of parts) {
    await prisma.part.upsert({
      where: {
        // Using a composite of name and manufacturer as unique identifier
        id: `${part.name}-${part.manufacturer}`.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
      create: {
        id: `${part.name}-${part.manufacturer}`.toLowerCase().replace(/\s+/g, '-'),
        name: part.name,
        manufacturer: part.manufacturer,
        partType: part.type,
        price: part.price,
      },
    });
  }

  // Create compatibility relationships
  console.log('🔗 Creating compatibility relationships...');
  
  // Get all weapon models
  const allWeaponModels = await prisma.weaponModel.findMany({
    include: { manufacturer: true },
  });

  // Get all parts by type
  const magazines = await prisma.part.findMany({ where: { partType: PartType.MAGAZINE } });
  const barrels = await prisma.part.findMany({ where: { partType: PartType.BARREL } });
  const hopUps = await prisma.part.findMany({ where: { partType: PartType.HOP_UP } });

  // Create compatibility for each weapon model
  for (const weaponModel of allWeaponModels) {
    // Magazine compatibility (varies by gearbox and manufacturer)
    for (const mag of magazines) {
      let score = 85; // Base compatibility
      
      // Same manufacturer = higher compatibility
      if (weaponModel.manufacturer.name === mag.manufacturer) {
        score = 100;
      }
      // Tokyo Marui parts are generally compatible with most AEGs
      else if (mag.manufacturer === 'Tokyo Marui') {
        score = 95;
      }
      // High-end magazines work well with most platforms
      else if (mag.name.includes('PTS') || mag.name.includes('KWA')) {
        score = 90;
      }

      await prisma.partCompatibility.upsert({
        where: {
          weaponModelId_partId: {
            weaponModelId: weaponModel.id,
            partId: mag.id,
          },
        },
        update: {},
        create: {
          weaponModelId: weaponModel.id,
          partId: mag.id,
          compatibilityScore: score,
          requiresModification: score < 90,
        },
      });
    }

    // Barrel compatibility (depends on gearbox type)
    for (const barrel of barrels) {
      let score = 90;
      
      // High-quality barrels are universally compatible
      if (barrel.name.includes('Prometheus') || barrel.name.includes('PDI')) {
        score = 100;
      } else if (barrel.name.includes('Lambda')) {
        score = 95;
      }

      await prisma.partCompatibility.upsert({
        where: {
          weaponModelId_partId: {
            weaponModelId: weaponModel.id,
            partId: barrel.id,
          },
        },
        update: {},
        create: {
          weaponModelId: weaponModel.id,
          partId: barrel.id,
          compatibilityScore: score,
          requiresModification: false,
        },
      });
    }

    // Hop-up compatibility
    for (const hopUp of hopUps) {
      let score = 85;
      
      // Same manufacturer
      if (weaponModel.manufacturer.name === hopUp.manufacturer) {
        score = 100;
      }
      // Maxx and Maple Leaf are premium upgrades
      else if (hopUp.name.includes('Maxx') || hopUp.name.includes('Maple Leaf')) {
        score = 95;
      }

      await prisma.partCompatibility.upsert({
        where: {
          weaponModelId_partId: {
            weaponModelId: weaponModel.id,
            partId: hopUp.id,
          },
        },
        update: {},
        create: {
          weaponModelId: weaponModel.id,
          partId: hopUp.id,
          compatibilityScore: score,
          requiresModification: score < 95,
        },
      });
    }
  }

  // ==========================================
  // PLATFORM SETTINGS - Gearted Expert, Commissions, etc.
  // ==========================================
  console.log('⚙️ Creating platform settings...');

  // Expert settings avec adresse Gearted par defaut
  await (prisma as any).platformSettings.upsert({
    where: { key: 'expert_settings' },
    update: {},
    create: {
      key: 'expert_settings',
      value: {
        enabled: true,
        price: 19.90,
        address: {
          name: 'Gearted - Service Expert',
          street: '', // A configurer dans l'admin
          city: '',
          postalCode: '',
          country: 'FR',
          phone: '',
          email: 'expert@gearted.com',
        },
      },
    },
  });

  // Commission settings
  await (prisma as any).platformSettings.upsert({
    where: { key: 'commissions' },
    update: {},
    create: {
      key: 'commissions',
      value: {
        enabled: true,
        buyerFeePercent: 5,
        sellerFeePercent: 5,
      },
    },
  });

  // Boost settings - Désactivé par défaut (pas assez d'annonces au lancement)
  await (prisma as any).platformSettings.upsert({
    where: { key: 'boost_settings' },
    update: {},
    create: {
      key: 'boost_settings',
      value: {
        enabled: false,              // Boost désactivé = produits aléatoires à la une
        showLatestSection: false,    // Section "Dernières annonces" masquée
      },
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
