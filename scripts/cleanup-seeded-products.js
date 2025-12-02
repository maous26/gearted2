#!/usr/bin/env node
/**
 * Script to cleanup seeded products from the database
 * This connects directly to the Railway backend API
 */

const https = require('https');

const BACKEND_URL = 'https://gearted2-production.up.railway.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'gearted-admin-2025';

// Seeded product identifiers
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

console.log('🧹 Gearted - Seeded Products Cleanup Script');
console.log('='.repeat(60));
console.log(`Backend: ${BACKEND_URL}`);
console.log('='.repeat(60));
console.log('');

// First, let's check the current state
console.log('📊 Step 1: Analyzing current products...\n');

const url = new URL('/api/products', BACKEND_URL);
url.searchParams.append('limit', '100');

https.get(url.toString(), (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            const products = response.products || [];

            console.log(`Total products in database: ${products.length}`);

            // Identify seeded products
            const seededProducts = products.filter(p =>
                SEEDED_PRODUCT_SLUGS.includes(p.slug) ||
                (p.seller && SEEDED_USER_EMAILS.some(email =>
                    p.seller.toLowerCase().includes(email.split('@')[0])
                ))
            );

            const realProducts = products.filter(p => !seededProducts.includes(p));

            console.log(`\n🌱 Seeded products found: ${seededProducts.length}`);
            seededProducts.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.title} (${p.slug})`);
            });

            console.log(`\n✨ Real products: ${realProducts.length}`);
            if (realProducts.length > 0) {
                console.log('   First 5 real products:');
                realProducts.slice(0, 5).forEach((p, i) => {
                    console.log(`   ${i + 1}. ${p.title}`);
                });
            }

            console.log('\n' + '='.repeat(60));
            console.log('⚠️  WARNING: The cleanup will use the /admin-clean-db endpoint');
            console.log('   which deletes ALL products. This is because we cannot');
            console.log('   authenticate as ADMIN to use the selective cleanup endpoint.');
            console.log('='.repeat(60));
            console.log('\n💡 Recommendation:');
            console.log('   1. If you have real products you want to keep, use Prisma Studio');
            console.log('   2. Run: cd backend && npm run db:studio');
            console.log('   3. Manually delete only the seeded products');
            console.log('\n   OR');
            console.log('\n   If you want to delete ALL products and start fresh,');
            console.log('   uncomment the cleanup code in this script and run again.');
            console.log('');

        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
        }
    });
}).on('error', (error) => {
    console.error('❌ Error fetching products:', error.message);
});

// Uncomment this section to actually perform the cleanup
/*
console.log('\n🗑️  Step 2: Performing cleanup...\n');

const cleanupUrl = new URL('/admin-clean-db', BACKEND_URL);
const options = {
  method: 'DELETE',
  headers: {
    'x-admin-secret': ADMIN_SECRET,
    'Content-Type': 'application/json'
  }
};

const req = https.request(cleanupUrl.toString(), options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Cleanup completed successfully!\n');
        console.log('Deleted:');
        console.log(`   - Products: ${response.deleted.products}`);
        console.log(`   - Users: ${response.deleted.users}`);
        console.log(`   - Favorites: ${response.deleted.favorites}`);
        console.log(`   - Transactions: ${response.deleted.transactions}`);
        console.log(`   - Messages: ${response.deleted.messages}`);
        console.log(`   - Notifications: ${response.deleted.notifications}`);
        
        if (response.keptUsers && response.keptUsers.length > 0) {
          console.log('\nKept users:');
          response.keptUsers.forEach(u => {
            console.log(`   - ${u.username} (${u.email})`);
          });
        }
      } else {
        console.error('❌ Cleanup failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Error parsing cleanup response:', error.message);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error during cleanup:', error.message);
});

req.end();
*/
