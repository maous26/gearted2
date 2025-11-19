/**
 * Script de test pour vérifier la configuration Railway
 *
 * Usage: npx ts-node scripts/test-railway-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRailwayConfig() {
  console.log('\n🔍 TEST DE CONFIGURATION RAILWAY\n');
  console.log('='.repeat(60));

  // Test 1: Variables d'environnement
  console.log('\n📋 1. VARIABLES D\'ENVIRONNEMENT');
  console.log('-'.repeat(60));
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Définie' : '❌ Non définie');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('PORT:', process.env.PORT || '3000');

  // Vérifier le type de base de données
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('postgres')) {
    console.log('Type de DB: ✅ PostgreSQL (Production)');
  } else if (dbUrl.includes('file:')) {
    console.log('Type de DB: ⚠️  SQLite (Développement)');
  } else {
    console.log('Type de DB: ❌ Inconnu');
  }

  // Test 2: Connexion à la base de données
  console.log('\n🔌 2. CONNEXION À LA BASE DE DONNÉES');
  console.log('-'.repeat(60));

  try {
    await prisma.$connect();
    console.log('✅ Connexion réussie');
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }

  // Test 3: Vérifier les données seedées
  console.log('\n🌱 3. DONNÉES SEEDÉES');
  console.log('-'.repeat(60));

  try {
    // Compter les manufacturiers
    const manufacturersCount = await prisma.manufacturer.findMany({
      where: { isActive: true },
      orderBy: { popularity: 'desc' },
    });
    console.log(`Manufacturiers: ${manufacturersCount.length} trouvés`);

    if (manufacturersCount.length > 0) {
      console.log('Top 5:');
      manufacturersCount.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} (popularité: ${m.popularity})`);
      });
    } else {
      console.log('⚠️  Aucun manufacturier trouvé - La DB doit être seedée!');
    }

    // Compter les armes
    const weaponsCount = await prisma.weaponModel.count({
      where: { isActive: true },
    });
    console.log(`\nArmes: ${weaponsCount} trouvées`);

    // Compter les pièces
    const partsCount = await prisma.part.count({
      where: { isActive: true },
    });
    console.log(`Pièces: ${partsCount} trouvées`);

    // Compter les relations de compatibilité
    const compatibilityCount = await prisma.partCompatibility.count();
    console.log(`Relations de compatibilité: ${compatibilityCount} trouvées`);

  } catch (error: any) {
    console.error('❌ Erreur lors de la lecture des données:', error.message);
  }

  // Test 4: Test de recherche
  console.log('\n🔍 4. TEST DE RECHERCHE');
  console.log('-'.repeat(60));

  try {
    // Recherche "Tokyo Marui"
    const tokyoResults = await prisma.weaponModel.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: 'Tokyo', mode: 'insensitive' } },
              { manufacturer: { name: { contains: 'Tokyo', mode: 'insensitive' } } },
            ],
          },
        ],
      },
      include: {
        manufacturer: true,
      },
      take: 5,
    });

    console.log(`Recherche "Tokyo": ${tokyoResults.length} résultats`);
    tokyoResults.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.name} (${w.manufacturer.name})`);
    });

    // Recherche pièces
    const parts = await prisma.part.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: 'Magazine', mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 3,
    });

    console.log(`\nRecherche "Magazine": ${parts.length} résultats`);
    parts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.manufacturer})`);
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la recherche:', error.message);
  }

  // Test 5: Endpoints critiques
  console.log('\n🌐 5. RÉSUMÉ DES ENDPOINTS');
  console.log('-'.repeat(60));
  console.log('Railway URL: https://empowering-truth-production.up.railway.app');
  console.log('\nEndpoints à tester:');
  console.log('  GET /health - Health check');
  console.log('  GET /api/search/items?query=Tokyo - Recherche');
  console.log('  GET /api/compatibility/manufacturers - Liste manufacturiers');
  console.log('\nTest avec curl:');
  console.log('  curl "https://empowering-truth-production.up.railway.app/health"');
  console.log('  curl "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"');

  // Test 6: Vérifier CORS
  console.log('\n🔐 6. CONFIGURATION CORS');
  console.log('-'.repeat(60));
  console.log('⚠️  Vérifiez que CORS autorise les requêtes depuis l\'app mobile');
  console.log('Headers requis:');
  console.log('  Access-Control-Allow-Origin: *');
  console.log('  Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
  console.log('  Access-Control-Allow-Headers: Content-Type, Authorization');

  // Fermer la connexion
  await prisma.$disconnect();

  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTS TERMINÉS\n');
}

// Exécuter les tests
testRailwayConfig()
  .catch((error) => {
    console.error('\n❌ ERREUR FATALE:', error);
    process.exit(1);
  });
