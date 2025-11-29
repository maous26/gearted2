import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting COMPLETE database cleanup...');

  // 1. Supprimer toutes les compatibilités
  console.log('🗑️  Deleting all part compatibilities...');
  await prisma.partCompatibility.deleteMany({});

  // 2. Supprimer tous les parts
  console.log('🗑️  Deleting all parts...');
  await prisma.part.deleteMany({});

  // 3. Supprimer tous les produits
  console.log('🗑️  Deleting all products...');
  await prisma.product.deleteMany({});

  // 4. Supprimer tous les modèles d'armes
  console.log('🗑️  Deleting all weapon models...');
  await prisma.weaponModel.deleteMany({});

  // 5. Supprimer tous les manufacturers
  console.log('🗑️  Deleting all manufacturers...');
  await prisma.manufacturer.deleteMany({});

  // 6. Supprimer tous les messages
  console.log('🗑️  Deleting all messages...');
  await prisma.message.deleteMany({});

  // 7. Supprimer toutes les conversations
  console.log('🗑️  Deleting all conversations...');
  await prisma.conversation.deleteMany({});

  // 8. Supprimer toutes les notifications
  console.log('🗑️  Deleting all notifications...');
  await prisma.notification.deleteMany({});

  // 9. Supprimer toutes les adresses de livraison
  console.log('🗑️  Deleting all shipping addresses...');
  await prisma.shippingAddress.deleteMany({});

  // 10. Supprimer tous les utilisateurs SAUF Iswael et Tata
  console.log('🗑️  Deleting all users except Iswael and Tata...');
  await prisma.user.deleteMany({
    where: {
      AND: [
        { username: { not: 'iswael' } },
        { username: { not: 'tata' } },
      ],
    },
  });

  // 11. Créer/mettre à jour les comptes Iswael et Tata
  console.log('👤 Ensuring Iswael and Tata accounts exist...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Compte Iswael
  const iswael = await prisma.user.upsert({
    where: { username: 'iswael' },
    update: {
      email: 'iswael@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Iswael',
      location: 'Paris, France',
    },
    create: {
      username: 'iswael',
      email: 'iswael@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Iswael',
      location: 'Paris, France',
    },
  });

  // Compte Tata
  const tata = await prisma.user.upsert({
    where: { username: 'tata' },
    update: {
      email: 'tata@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Tata',
      location: 'Lyon, France',
    },
    create: {
      username: 'tata',
      email: 'tata@gearted.com',
      password: hashedPassword,
      bio: 'Compte test Tata',
      location: 'Lyon, France',
    },
  });

  // 12. Statistiques finales
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const messageCount = await prisma.message.count();
  const conversationCount = await prisma.conversation.count();
  const manufacturerCount = await prisma.manufacturer.count();
  const weaponModelCount = await prisma.weaponModel.count();
  const partCount = await prisma.part.count();
  const notificationCount = await prisma.notification.count();
  const shippingAddressCount = await prisma.shippingAddress.count();

  console.log('\n✅ Database COMPLETELY cleaned!');
  console.log('📊 Final statistics:');
  console.log(`   - Users: ${userCount} (Iswael + Tata)`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Messages: ${messageCount}`);
  console.log(`   - Conversations: ${conversationCount}`);
  console.log(`   - Manufacturers: ${manufacturerCount}`);
  console.log(`   - Weapon Models: ${weaponModelCount}`);
  console.log(`   - Parts: ${partCount}`);
  console.log(`   - Notifications: ${notificationCount}`);
  console.log(`   - Shipping Addresses: ${shippingAddressCount}`);
  console.log('\n🔐 Login credentials:');
  console.log(`   Username: iswael (ID: ${iswael.id}) | Password: password123`);
  console.log(`   Username: tata   (ID: ${tata.id})   | Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

