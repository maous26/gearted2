#!/usr/bin/env ts-node
/**
 * Script to seed Railway PostgreSQL database with GearCheck data
 * Run with: npx ts-node scripts/seed-railway.ts
 */

import { PartType, PrismaClient, WeaponType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRailway() {
  console.log('🚂 Starting Railway database seed...');

  try {
    // Check if already seeded
    const manufacturerCount = await prisma.manufacturer.count();
    if (manufacturerCount > 0) {
      console.log(`✅ Database already has ${manufacturerCount} manufacturers. Skipping seed.`);
      const weaponCount = await prisma.weaponModel.count();
      const partCount = await prisma.part.count();
      console.log(`   Weapons: ${weaponCount}, Parts: ${partCount}`);
      return;
    }

    console.log('📦 Creating 20 airsoft manufacturers...');
    const manufacturers = [
      { name: 'Tokyo Marui', country: 'Japan', popularity: 100 },
      { name: 'KWA', country: 'Taiwan', popularity: 95 },
      { name: 'VFC', country: 'Taiwan', popularity: 92 },
      { name: 'G&G Armament', country: 'Taiwan', popularity: 90 },
      { name: 'Krytac', country: 'USA', popularity: 88 },
      { name: 'Classic Army', country: 'Hong Kong', popularity: 85 },
      { name: 'ICS', country: 'Taiwan', popularity: 83 },
      { name: 'ASG', country: 'Denmark', popularity: 80 },
      { name: 'Cybergun', country: 'France', popularity: 78 },
      { name: 'Elite Force', country: 'USA', popularity: 76 },
      { name: 'LCT Airsoft', country: 'China', popularity: 74 },
      { name: 'E&L', country: 'China', popularity: 72 },
      { name: 'ARES', country: 'Hong Kong', popularity: 70 },
      { name: 'King Arms', country: 'Hong Kong', popularity: 68 },
      { name: 'A&K', country: 'China', popularity: 65 },
      { name: 'WE Tech', country: 'Taiwan', popularity: 63 },
      { name: 'CYMA', country: 'China', popularity: 60 },
      { name: 'Lancer Tactical', country: 'Taiwan', popularity: 58 },
      { name: 'Valken', country: 'USA', popularity: 55 },
      { name: 'Specna Arms', country: 'Poland', popularity: 53 },
    ];

    for (const mfg of manufacturers) {
      await prisma.manufacturer.create({
        data: {
          name: mfg.name,
          slug: mfg.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
          country: mfg.country,
          popularity: mfg.popularity,
          isActive: true,
        },
      });
    }
    console.log(`   ✓ Created ${manufacturers.length} manufacturers`);

    console.log('🔫 Creating weapon models...');
    const weaponModels = [
      { mfg: 'Tokyo Marui', model: 'M4A1 MWS', type: WeaponType.ASSAULT_RIFLE, gearbox: 'GBB', hopUp: 'Adjustable' },
      { mfg: 'Tokyo Marui', model: 'AK47', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V3', hopUp: 'Standard' },
      { mfg: 'Tokyo Marui', model: 'VSR-10', type: WeaponType.SNIPER_RIFLE, gearbox: 'Spring', hopUp: 'Adjustable' },
      { mfg: 'Tokyo Marui', model: 'Hi-Capa 5.1', type: WeaponType.PISTOL, gearbox: 'GBB', hopUp: 'Fixed' },
      { mfg: 'KWA', model: 'KM4A1', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V2', hopUp: 'Adjustable' },
      { mfg: 'KWA', model: 'Ronin T6', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V2', hopUp: 'Adjustable' },
      { mfg: 'VFC', model: 'Avalon', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V2', hopUp: 'Rotary' },
      { mfg: 'VFC', model: 'HK416A5', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V2', hopUp: 'Rotary' },
      { mfg: 'G&G Armament', model: 'CM16 Raider', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V2', hopUp: 'Standard' },
      { mfg: 'G&G Armament', model: 'ARP9', type: WeaponType.SMG, gearbox: 'V2', hopUp: 'Rotary' },
      { mfg: 'Krytac', model: 'Trident MK2', type: WeaponType.ASSAULT_RIFLE, gearbox: 'Proprietary', hopUp: 'Rotary' },
      { mfg: 'Krytac', model: 'Vector', type: WeaponType.SMG, gearbox: 'V2', hopUp: 'Rotary' },
      { mfg: 'LCT Airsoft', model: 'AK-74M', type: WeaponType.ASSAULT_RIFLE, gearbox: 'V3', hopUp: 'Standard' },
    ];

    let weaponCount = 0;
    for (const weapon of weaponModels) {
      const manufacturer = await prisma.manufacturer.findFirst({
        where: { name: weapon.mfg },
      });

      if (manufacturer) {
        await prisma.weaponModel.create({
          data: {
            manufacturerId: manufacturer.id,
            name: `${weapon.mfg} ${weapon.model}`,
            model: weapon.model,
            version: '',
            weaponType: weapon.type,
            gearboxType: weapon.gearbox,
            hopUpType: weapon.hopUp,
            isActive: true,
          },
        });
        weaponCount++;
      }
    }
    console.log(`   ✓ Created ${weaponCount} weapon models`);

    console.log('🔧 Creating compatible parts...');
    const parts = [
      // Magazines
      { name: 'Tokyo Marui 30rd Magazine', mfg: 'Tokyo Marui', type: PartType.MAGAZINE, price: 25 },
      { name: 'G&P 120rd Mid-Cap', mfg: 'G&P', type: PartType.MAGAZINE, price: 18 },
      { name: 'PTS EPM', mfg: 'PTS', type: PartType.MAGAZINE, price: 22 },
      { name: 'KWA K120 Mid-Cap', mfg: 'KWA', type: PartType.MAGAZINE, price: 20 },
      // Barrels
      { name: 'Prometheus 6.03mm Barrel', mfg: 'Prometheus', type: PartType.BARREL, price: 45 },
      { name: 'Lambda Five Barrel', mfg: 'Lambda', type: PartType.BARREL, price: 38 },
      { name: 'PDI 6.05mm Barrel', mfg: 'PDI', type: PartType.BARREL, price: 55 },
      // Hop-ups
      { name: 'Maple Leaf Hop-up Chamber', mfg: 'Maple Leaf', type: PartType.HOP_UP, price: 35 },
      { name: 'Maxx Model Hop-up', mfg: 'Maxx', type: PartType.HOP_UP, price: 48 },
      // Motors
      { name: 'ASG Ultimate 30K Motor', mfg: 'ASG', type: PartType.MOTOR, price: 65 },
      { name: 'SHS High Torque Motor', mfg: 'SHS', type: PartType.MOTOR, price: 35 },
      // Optics
      { name: 'Vortex Red Dot', mfg: 'Vortex', type: PartType.OPTIC, price: 120 },
    ];

    let partCount = 0;
    for (const part of parts) {
      await prisma.part.create({
        data: {
          id: `${part.name}-${part.mfg}`.toLowerCase().replace(/\s+/g, '-'),
          name: part.name,
          manufacturer: part.mfg,
          partType: part.type,
          price: part.price,
          isActive: true,
        },
      });
      partCount++;
    }
    console.log(`   ✓ Created ${partCount} parts`);

    console.log('🔗 Creating compatibility relationships...');
    const allWeapons = await prisma.weaponModel.findMany({
      include: { manufacturer: true },
    });
    const allParts = await prisma.part.findMany();

    let compatCount = 0;
    for (const weapon of allWeapons) {
      for (const part of allParts) {
        let score = 85; // Base compatibility

        // Same manufacturer bonus
        if (weapon.manufacturer.name === part.manufacturer) {
          score = 100;
        }
        // Premium parts work well everywhere
        else if (part.name.includes('Prometheus') || part.name.includes('PDI') || part.name.includes('Maxx')) {
          score = 98;
        }
        // Tokyo Marui parts are highly compatible
        else if (part.manufacturer === 'Tokyo Marui') {
          score = 95;
        }

        await prisma.partCompatibility.create({
          data: {
            weaponModelId: weapon.id,
            partId: part.id,
            compatibilityScore: score,
            requiresModification: score < 95,
          },
        });
        compatCount++;
      }
    }
    console.log(`   ✓ Created ${compatCount} compatibility relationships`);

    console.log('\n✅ Railway database seeded successfully!');
    console.log(`   📊 Summary:`);
    console.log(`      - ${manufacturers.length} manufacturers`);
    console.log(`      - ${weaponCount} weapon models`);
    console.log(`      - ${partCount} parts`);
    console.log(`      - ${compatCount} compatibility relationships`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedRailway()
  .then(() => {
    console.log('\n🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed:', error);
    process.exit(1);
  });

