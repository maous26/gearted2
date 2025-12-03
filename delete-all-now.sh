#!/bin/bash

# Script pour supprimer tous les produits via Prisma
# Ce script se connecte à la base de données Railway et supprime tout

echo "🗑️  Suppression de TOUS les produits de la base de données..."
echo ""
echo "⚠️  ATTENTION: Cette action est IRRÉVERSIBLE!"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Annulé."
    exit 0
fi

echo ""
echo "📦 Suppression en cours..."

cd backend

# Exécuter le script de suppression avec Prisma
npx ts-node << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllProducts() {
  try {
    console.log('🗑️  Suppression des images de produits...');
    const deletedImages = await prisma.productImage.deleteMany({});
    console.log(`   ✓ ${deletedImages.count} images supprimées`);

    console.log('🗑️  Suppression des favoris...');
    const deletedFavorites = await prisma.favorite.deleteMany({});
    console.log(`   ✓ ${deletedFavorites.count} favoris supprimés`);

    console.log('🗑️  Suppression des produits...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`   ✓ ${deletedProducts.count} produits supprimés`);

    const remaining = await prisma.product.count();
    console.log('');
    console.log(`✅ Terminé! Produits restants: ${remaining}`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProducts();
EOF

echo ""
echo "✅ Tous les produits ont été supprimés!"
echo "🔄 Rechargez votre app pour voir le marketplace vide."
