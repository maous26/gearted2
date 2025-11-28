import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup...');

  // 1. Supprimer tous les produits (et leurs relations en cascade)
  console.log('🗑️  Deleting all products...');
  await prisma.product.deleteMany({});

  // 2. Supprimer tous les messages
  console.log('🗑️  Deleting all messages...');
  await prisma.message.deleteMany({});

  // 3. Supprimer toutes les conversations
  console.log('🗑️  Deleting all conversations...');
  await prisma.conversation.deleteMany({});

  // 4. Supprimer toutes les notifications
  console.log('🗑️  Deleting all notifications...');
  await prisma.notification.deleteMany({});

  // 5. Supprimer toutes les adresses de livraison
  console.log('🗑️  Deleting all shipping addresses...');
  await prisma.shippingAddress.deleteMany({});

  // 6. Supprimer tous les utilisateurs SAUF Iswael et Tata
  console.log('🗑️  Deleting all users except Iswael and Tata...');
  await prisma.user.deleteMany({
    where: {
      AND: [
        { username: { not: 'iswael' } },
        { username: { not: 'tata' } },
      ],
    },
  });

  // 7. Vérifier/créer les comptes Iswael et Tata
  console.log('👤 Ensuring Iswael and Tata accounts exist...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Compte Iswael
  await prisma.user.upsert({
    where: { username: 'iswael' },
    update: {},
    create: {
      id: 'iswael-user-id',
      username: 'iswael',
      email: 'iswael@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Iswael',
      location: 'Paris, France',
    },
  });

  // Compte Tata
  await prisma.user.upsert({
    where: { username: 'tata' },
    update: {},
    create: {
      id: 'tata-user-id',
      username: 'tata',
      email: 'tata@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Tata',
      location: 'Lyon, France',
    },
  });

  // 8. Statistiques finales
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const messageCount = await prisma.message.count();
  const conversationCount = await prisma.conversation.count();

  console.log('\n✅ Database cleaned successfully!');
  console.log('📊 Final statistics:');
  console.log(`   - Users: ${userCount} (Iswael + Tata)`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Messages: ${messageCount}`);
  console.log(`   - Conversations: ${conversationCount}`);
  console.log('\n🔐 Login credentials:');
  console.log('   Username: iswael | Password: password123');
  console.log('   Username: tata   | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
