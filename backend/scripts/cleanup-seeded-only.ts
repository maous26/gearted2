import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seeded product identifiers from seed-products.ts
const SEEDED_PRODUCT_SLUGS = [
    'ak-74-kalashnikov-replique',
    'red-dot-sight-eotech-552',
    'gilet-tactique-multicam',
    'billes-0-25g-bio-5000pcs',
    'm4a1-custom-build',
    'chargeur-m4-120-billes'
];

const SEEDED_USER_EMAILS = [
    'vendeur@gearted.com',
    'tactical@gearted.com',
    'milsim@gearted.com'
];

async function main() {
    console.log('🧹 Cleaning up seeded products from database...\n');

    try {
        // Step 1: Find all products
        const allProducts = await prisma.product.findMany({
            include: {
                seller: {
                    select: {
                        email: true,
                        username: true
                    }
                }
            }
        });

        console.log(`📊 Total products in database: ${allProducts.length}\n`);

        // Step 2: Identify seeded products
        const seededProducts = allProducts.filter(p =>
            SEEDED_PRODUCT_SLUGS.includes(p.slug) ||
            SEEDED_USER_EMAILS.includes(p.seller.email)
        );

        console.log(`🌱 Seeded products to delete: ${seededProducts.length}`);
        seededProducts.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title} (${p.slug})`);
            console.log(`      Seller: ${p.seller.username} (${p.seller.email})`);
        });

        if (seededProducts.length === 0) {
            console.log('\n✅ No seeded products found. Database is clean!');
            return;
        }

        // Step 3: Delete seeded products
        console.log('\n🗑️  Deleting seeded products...');

        const deletedBySlug = await prisma.product.deleteMany({
            where: {
                slug: {
                    in: SEEDED_PRODUCT_SLUGS
                }
            }
        });

        console.log(`   ✓ Deleted ${deletedBySlug.count} products by slug`);

        // Step 4: Delete products by seeded users
        const deletedByUser = await prisma.product.deleteMany({
            where: {
                seller: {
                    email: {
                        in: SEEDED_USER_EMAILS
                    }
                }
            }
        });

        console.log(`   ✓ Deleted ${deletedByUser.count} products by seeded users`);

        // Step 5: Delete seeded users
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                email: {
                    in: SEEDED_USER_EMAILS
                }
            }
        });

        console.log(`   ✓ Deleted ${deletedUsers.count} seeded users`);

        // Step 6: Show final count
        const remainingProducts = await prisma.product.count();
        console.log(`\n✅ Cleanup complete!`);
        console.log(`📊 Remaining products: ${remainingProducts}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Cleanup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
