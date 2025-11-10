import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isEmailVerified: true,
        isActive: true
      }
    });

    console.log(`📊 Total users: ${users.length}\n`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
        console.log(`  Active: ${user.isActive}`);
        console.log(`  Email verified: ${user.isEmailVerified}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
