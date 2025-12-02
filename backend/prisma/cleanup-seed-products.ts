import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of seeded products...');

    // These are the exact slugs from seed-products.ts
    const seededProductSlugs = [
        'ak-74-kalashnikov-replique',
        'red-dot-sight-eotech-552',
        'gilet-tactique-multicam',
        'billes-0-25g-bio-5000pcs',
        'm4a1-custom-build',
        'chargeur-m4-120-billes'
    ];

    // Also delete the seeded users (optional - comment out if you want to keep them)
    const seededUserEmails = [
        'vendeur@gearted.com',
        'tactical@gearted.com',
        'milsim@gearted.com'
    ];

    console.log(`📦 Looking for ${seededProductSlugs.length} seeded products...`);

    // Delete products by slug
    const deletedProducts = await prisma.product.deleteMany({
        where: {
            slug: {
                in: seededProductSlugs
            }
        }
    });

    console.log(`✅ Deleted ${deletedProducts.count} seeded products`);

    // Optional: Delete seeded users and their products
    console.log(`👤 Looking for ${seededUserEmails.length} seeded users...`);

    const deletedUsers = await prisma.user.deleteMany({
        where: {
            email: {
                in: seededUserEmails
            }
        }
    });

    console.log(`✅ Deleted ${deletedUsers.count} seeded users`);

    // Show remaining products count
    const remainingProducts = await prisma.product.count();
    console.log(`\n📊 Remaining products in database: ${remainingProducts}`);

    console.log('\n✨ Cleanup completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
