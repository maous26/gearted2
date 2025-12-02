import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Analyzing database products...\n');

    // Get all products with their sellers
    const allProducts = await prisma.product.findMany({
        include: {
            seller: {
                select: {
                    email: true,
                    username: true
                }
            },
            category: {
                select: {
                    name: true,
                    slug: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`📊 Total products in database: ${allProducts.length}\n`);

    // Identify seeded products (from seed-products.ts)
    const seededProductSlugs = [
        'ak-74-kalashnikov-replique',
        'red-dot-sight-eotech-552',
        'gilet-tactique-multicam',
        'billes-0-25g-bio-5000pcs',
        'm4a1-custom-build',
        'chargeur-m4-120-billes'
    ];

    const seededUserEmails = [
        'vendeur@gearted.com',
        'tactical@gearted.com',
        'milsim@gearted.com'
    ];

    const seededProducts = allProducts.filter(p =>
        seededProductSlugs.includes(p.slug) ||
        seededUserEmails.includes(p.seller.email)
    );

    const realProducts = allProducts.filter(p =>
        !seededProductSlugs.includes(p.slug) &&
        !seededUserEmails.includes(p.seller.email)
    );

    console.log(`🌱 Seeded products (from seed-products.ts): ${seededProducts.length}`);
    seededProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} (${p.slug})`);
        console.log(`      Seller: ${p.seller.username} (${p.seller.email})`);
        console.log(`      Created: ${p.createdAt.toISOString()}`);
    });

    console.log(`\n✨ Real/User products: ${realProducts.length}`);
    if (realProducts.length > 0) {
        realProducts.slice(0, 10).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title}`);
            console.log(`      Seller: ${p.seller.username} (${p.seller.email})`);
            console.log(`      Created: ${p.createdAt.toISOString()}`);
        });
        if (realProducts.length > 10) {
            console.log(`   ... and ${realProducts.length - 10} more`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 To delete seeded products, run:');
    console.log('   npm run cleanup:seed-products');
    console.log('='.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
