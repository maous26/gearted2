import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Clean database - keep only specified users
 * DELETE /api/admin/clean-database
 * Requires admin secret key in X-Admin-Secret header
 */
router.delete('/clean-database', async (req: Request, res: Response): Promise<any> => {
  // Check for admin secret key in header
  const adminSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET_KEY || 'gearted-admin-2025';

  if (!adminSecret || adminSecret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid or missing admin secret key' });
  }

  try {
    console.log('[Admin] Starting database cleanup...');

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
    console.log(`[Admin] Found ${usersToKeep.length} users to keep:`, usersToKeep.map(u => u.username));

    // Delete in order (respecting foreign keys)
    const results = {
      notifications: 0,
      messages: 0,
      conversations: 0,
      transactions: 0,
      shippingAddresses: 0,
      favorites: 0,
      products: 0,
      parcelDimensions: 0,
      users: 0,
    };

    // Delete notifications
    results.notifications = (await prisma.notification.deleteMany({})).count;

    // Delete all messages first
    results.messages = (await prisma.message.deleteMany({})).count;

    // Then delete conversations
    results.conversations = (await prisma.conversation.deleteMany({})).count;

    // Delete transactions
    results.transactions = (await prisma.transaction.deleteMany({})).count;

    // Delete shipping addresses
    results.shippingAddresses = (await prisma.shippingAddress.deleteMany({})).count;

    // Delete all favorites
    results.favorites = (await prisma.favorite.deleteMany({})).count;

    // Delete all products
    results.products = (await prisma.product.deleteMany({})).count;

    // Delete orphaned parcel dimensions
    results.parcelDimensions = (await prisma.parcelDimensions.deleteMany({})).count;

    // Delete users not in keep list
    results.users = (await prisma.user.deleteMany({
      where: { id: { notIn: userIdsToKeep } }
    })).count;

    console.log('[Admin] Database cleanup complete:', results);

    return res.json({
      success: true,
      message: 'Database cleaned successfully',
      keptUsers: usersToKeep.map(u => ({ username: u.username, email: u.email })),
      deleted: results
    });

  } catch (error) {
    console.error('[Admin] Error during cleanup:', error);
    return res.status(500).json({
      error: 'Error during database cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
