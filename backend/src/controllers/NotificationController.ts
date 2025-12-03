import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return res.json({
        success: true,
        notifications,
        unreadCount,
      });
    } catch (error: any) {
      console.error('[NotificationController] Error getting notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
        error: error.message,
      });
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification introuvable',
        });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return res.json({
        success: true,
        message: 'Notification marquée comme lue',
      });
    } catch (error: any) {
      console.error('[NotificationController] Error marking as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la notification',
        error: error.message,
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
      }

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return res.json({
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues',
      });
    } catch (error: any) {
      console.error('[NotificationController] Error marking all as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des notifications',
        error: error.message,
      });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification introuvable',
        });
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return res.json({
        success: true,
        message: 'Notification supprimée',
      });
    } catch (error: any) {
      console.error('[NotificationController] Error deleting notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
        error: error.message,
      });
    }
  }

  /**
   * Create a notification (internal use - for other controllers)
   */
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SHIPPING_UPDATE' | 'PAYMENT_UPDATE' | 'MESSAGE';
    data?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data || {},
        },
      });

      // 💬 ALSO CREATE A MESSAGE FROM "Hugo de Gearted"
      // Find or create "Hugo de Gearted" system user
      let hugoUser = await prisma.user.findFirst({
        where: { username: 'hugo-gearted' }
      });

      if (!hugoUser) {
        // Create Hugo de Gearted system user if doesn't exist
        hugoUser = await prisma.user.create({
          data: {
            username: 'hugo-gearted',
            email: 'hugo@gearted.com',
            password: '', // No password - system account
            firstName: 'Hugo',
            lastName: 'de Gearted',
            role: 'ADMIN',
            isActive: true,
            isEmailVerified: true,
            badges: ['admin', 'verified']
          }
        });
        console.log('[NotificationController] Created Hugo de Gearted system user');
      }

      // Find or create conversation between Hugo and the user
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { id: hugoUser.id } } },
            { participants: { some: { id: data.userId } } }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              connect: [
                { id: hugoUser.id },
                { id: data.userId }
              ]
            }
          }
        });
        console.log(`[NotificationController] Created conversation between Hugo and user ${data.userId}`);
      }

      // Create message in the conversation
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: hugoUser.id,
          content: `${data.title}\n\n${data.message}`
        }
      });

      console.log(`[NotificationController] Created message from Hugo for user ${data.userId}`);

      return notification;
    } catch (error: any) {
      console.error('[NotificationController] Error creating notification:', error);
      throw error;
    }
  }
}

