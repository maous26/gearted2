import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllProducts() {
    try {
        console.log('🗑️  Suppression de TOUS les produits...\n');

        console.log('📦 Suppression des images de produits...');
        const deletedImages = await prisma.productImage.deleteMany({});
        console.log(`   ✓ ${deletedImages.count} images supprimées`);

        console.log('📦 Suppression des favoris...');
        const deletedFavorites = await prisma.favorite.deleteMany({});
        console.log(`   ✓ ${deletedFavorites.count} favoris supprimés`);

        console.log('📦 Suppression des produits...');
        const deletedProducts = await prisma.product.deleteMany({});
        console.log(`   ✓ ${deletedProducts.count} produits supprimés`);

        const remaining = await prisma.product.count();
        console.log('');
        console.log(`✅ TERMINÉ! Produits restants: ${remaining}`);
        console.log('🔄 Rechargez votre app - le marketplace sera vide!');
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllProducts();
