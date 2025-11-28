import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Get users to keep
    const usersToKeep = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'iswael0552617' },
          { username: 'tata' },
          { email: { contains: 'iswael' } },
          { email: { contains: 'tata' } }
        ]
      }
    });

    const userIdsToKeep = usersToKeep.map(u => u.id);
    console.log(`✅ Found ${usersToKeep.length} users to keep:`);
    usersToKeep.forEach(u => console.log(`   - ${u.username} (${u.email})`));
    console.log('');

    // Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: { notIn: userIdsToKeep } }
    });
    console.log(`🗑️  Deleted ${deletedNotifications.count} notifications from other users`);

    // Delete messages and conversations
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { notIn: userIdsToKeep } },
          { conversation: { participants: { none: { id: { in: userIdsToKeep } } } } }
        ]
      }
    });
    console.log(`🗑️  Deleted ${deletedMessages.count} messages`);

    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        participants: { none: { id: { in: userIdsToKeep } } }
      }
    });
    console.log(`🗑️  Deleted ${deletedConversations.count} conversations`);

    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`🗑️  Deleted ${deletedTransactions.count} transactions`);

    // Delete shipping addresses
    const deletedShippingAddresses = await prisma.shippingAddress.deleteMany({});
    console.log(`🗑️  Deleted ${deletedShippingAddresses.count} shipping addresses`);

    // Delete favorites
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: { userId: { notIn: userIdsToKeep } }
    });
    console.log(`🗑️  Deleted ${deletedFavorites.count} favorites`);

    // Delete products
    const deletedProducts = await prisma.product.deleteMany({
      where: { sellerId: { notIn: userIdsToKeep } }
    });
    console.log(`🗑️  Deleted ${deletedProducts.count} products`);

    // Delete parcel dimensions (orphaned)
    const deletedDimensions = await prisma.parcelDimensions.deleteMany({
      where: { products: { none: {} } }
    });
    console.log(`🗑️  Deleted ${deletedDimensions.count} orphaned parcel dimensions`);

    // Delete users not in keep list
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { notIn: userIdsToKeep } }
    });
    console.log(`🗑️  Deleted ${deletedUsers.count} users\n`);

    console.log('✨ Database cleanup complete!');
    console.log(`\n📊 Kept ${usersToKeep.length} users: ${usersToKeep.map(u => u.username).join(', ')}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
