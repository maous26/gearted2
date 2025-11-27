import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des notifications',
    });
  }
});

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à modifier cette notification',
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('[Notifications] Error marking notification as read:', error);
    return res.status(500).json({
      error: 'Erreur lors de la mise à jour de la notification',
    });
  }
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put('/read-all', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
    });
  } catch (error) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    return res.status(500).json({
      error: 'Erreur lors de la mise à jour des notifications',
    });
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à supprimer cette notification',
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Notification supprimée',
    });
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    return res.status(500).json({
      error: 'Erreur lors de la suppression de la notification',
    });
  }
});

export default router;
