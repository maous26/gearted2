import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

/**
 * Nettoyer TOUTE la base de données sauf Iswael et Tata
 * GET /api/admin/clean-database
 */
router.get('/clean-database', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Starting COMPLETE database cleanup from API...');

    // 1. Supprimer toutes les compatibilités
    await prisma.partCompatibility.deleteMany({});
    console.log('✅ Deleted part compatibilities');

    // 2. Supprimer tous les parts
    await prisma.part.deleteMany({});
    console.log('✅ Deleted parts');

    // 3. Supprimer tous les produits
    await prisma.product.deleteMany({});
    console.log('✅ Deleted products');

    // 4. Supprimer tous les modèles d'armes
    await prisma.weaponModel.deleteMany({});
    console.log('✅ Deleted weapon models');

    // 5. Supprimer tous les manufacturers
    await prisma.manufacturer.deleteMany({});
    console.log('✅ Deleted manufacturers');

    // 6. Supprimer tous les messages
    await prisma.message.deleteMany({});
    console.log('✅ Deleted messages');

    // 7. Supprimer toutes les conversations
    await prisma.conversation.deleteMany({});
    console.log('✅ Deleted conversations');

    // 8. Supprimer toutes les notifications
    await prisma.notification.deleteMany({});
    console.log('✅ Deleted notifications');

    // 9. Supprimer toutes les adresses de livraison
    await prisma.shippingAddress.deleteMany({});
    console.log('✅ Deleted shipping addresses');

    // 10. Supprimer tous les utilisateurs SAUF Iswael et Tata
    await prisma.user.deleteMany({
      where: {
        AND: [
          { username: { not: 'iswael' } },
          { username: { not: 'tata' } },
        ],
      },
    });
    console.log('✅ Deleted all users except Iswael and Tata');

    // 11. Créer/mettre à jour les comptes Iswael et Tata
    const hashedPassword = await bcrypt.hash('password123', 10);

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

    // Statistiques finales
    const stats = {
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      messages: await prisma.message.count(),
      conversations: await prisma.conversation.count(),
      manufacturers: await prisma.manufacturer.count(),
      weaponModels: await prisma.weaponModel.count(),
      parts: await prisma.part.count(),
      notifications: await prisma.notification.count(),
      shippingAddresses: await prisma.shippingAddress.count(),
    };

    console.log('✅ Database cleaned successfully!', stats);

    res.json({
      success: true,
      message: 'Database cleaned successfully!',
      stats,
      accounts: [
        { username: 'iswael', id: iswael.id, password: 'password123' },
        { username: 'tata', id: tata.id, password: 'password123' },
      ],
    });
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean database',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
