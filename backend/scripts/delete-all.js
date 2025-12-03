const { Client } = require('pg');

async function deleteAllProducts() {
    // Récupérer DATABASE_URL depuis les variables d'environnement
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL non trouvée');
        process.exit(1);
    }

    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('🗑️  Connexion à la base de données...\n');
        await client.connect();

        console.log('📦 Suppression des images de produits...');
        const images = await client.query('DELETE FROM "product_images"');
        console.log(`   ✓ ${images.rowCount} images supprimées`);

        console.log('📦 Suppression des favoris...');
        const favorites = await client.query('DELETE FROM "favorites"');
        console.log(`   ✓ ${favorites.rowCount} favoris supprimés`);

        console.log('📦 Suppression des produits...');
        const products = await client.query('DELETE FROM "products"');
        console.log(`   ✓ ${products.rowCount} produits supprimés`);

        const count = await client.query('SELECT COUNT(*) FROM "products"');
        console.log('');
        console.log(`✅ TERMINÉ! Produits restants: ${count.rows[0].count}`);
        console.log('🔄 Rechargez votre app - le marketplace sera vide!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deleteAllProducts();
