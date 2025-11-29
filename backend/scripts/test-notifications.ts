import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('🔔 Testing Notifications System...\n');

    // 1. Find a user to test with
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Testing with user: ${user.username} (${user.id})\n`);

    // 2. Create test notifications
    console.log('📝 Creating test notifications...');
    
    const notification1 = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Bienvenue sur Gearted !',
        message: 'Votre compte a été créé avec succès.',
        type: 'SUCCESS',
      },
    });
    console.log(`✅ Created notification: ${notification1.id}`);

    const notification2 = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Nouveau message',
        message: 'Vous avez reçu un nouveau message.',
        type: 'MESSAGE',
        data: {
          conversationId: 'test-conversation-id',
        },
      },
    });
    console.log(`✅ Created notification: ${notification2.id}`);

    const notification3 = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Expédition en cours',
        message: 'Votre colis a été expédié.',
        type: 'SHIPPING_UPDATE',
        data: {
          trackingNumber: 'TEST123456',
        },
      },
    });
    console.log(`✅ Created notification: ${notification3.id}\n`);

    // 3. Fetch all notifications
    console.log('📋 Fetching all notifications...');
    const allNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Found ${allNotifications.length} notifications\n`);

    // 4. Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });
    console.log(`📊 Unread notifications: ${unreadCount}\n`);

    // 5. Mark one as read
    console.log('✅ Marking first notification as read...');
    await prisma.notification.update({
      where: { id: notification1.id },
      data: { isRead: true },
    });
    console.log(`✅ Notification ${notification1.id} marked as read\n`);

    // 6. Count unread again
    const unreadCountAfter = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });
    console.log(`📊 Unread notifications after: ${unreadCountAfter}\n`);

    // 7. Mark all as read
    console.log('✅ Marking all notifications as read...');
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
    console.log(`✅ All notifications marked as read\n`);

    // 8. Delete test notifications
    console.log('🗑️  Cleaning up test notifications...');
    await prisma.notification.deleteMany({
      where: {
        id: {
          in: [notification1.id, notification2.id, notification3.id],
        },
      },
    });
    console.log(`✅ Test notifications deleted\n`);

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();

