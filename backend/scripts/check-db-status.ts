#!/usr/bin/env ts-node
/**
 * Script to check database status and product count
 * Run with: npx ts-node scripts/check-db-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDbStatus() {
  console.log('📊 Database Status Check\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection: OK\n');
    
    // Count records in main tables
    const [
      userCount,
      productCount,
      categoryCount,
      transactionCount,
      notificationCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.transaction.count(),
      prisma.notification.count()
    ]);
    
    console.log('📈 Record counts:');
    console.log(`   Users:         ${userCount}`);
    console.log(`   Products:      ${productCount}`);
    console.log(`   Categories:    ${categoryCount}`);
    console.log(`   Transactions:  ${transactionCount}`);
    console.log(`   Notifications: ${notificationCount}`);
    
    // Show active products
    if (productCount > 0) {
      const activeProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, price: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📦 Recent active products:');
      activeProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} - €${p.price} (${p.createdAt.toLocaleDateString()})`);
      });
    } else {
      console.log('\n⚠️  No products in database');
    }
    
    // Check for any products with non-ACTIVE status
    const statusCounts = await prisma.product.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    if (statusCounts.length > 0) {
      console.log('\n📊 Products by status:');
      statusCounts.forEach(s => {
        console.log(`   ${s.status}: ${s._count.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbStatus();
