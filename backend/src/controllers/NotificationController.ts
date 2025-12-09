import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { socketService } from '../services/socketService';

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
   * Enhanced: Groups messages by transaction in dedicated conversations
   */
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SHIPPING_UPDATE' | 'PAYMENT_UPDATE' | 'MESSAGE';
    data?: any;
  }) {
    try {
      // Extract navigation info from data
      const navigationTarget = data.data?.navigationTarget || this.getDefaultNavigationTarget(data.data);
      
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: {
            ...data.data,
            navigationTarget, // Add navigation target for frontend
          },
        },
      });

      // NOTE: Les notifications sont suffisantes, pas besoin de créer des messages dupliqués
      // Les utilisateurs verront les notifications dans l'onglet "Suivi de transaction"

      // 🔔 EMIT SOCKET.IO NOTIFICATION IN REAL-TIME
      socketService.sendNotification(data.userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        createdAt: notification.createdAt.toISOString()
      });

      return notification;
    } catch (error: any) {
      console.error('[NotificationController] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get default navigation target based on notification data
   */
  private static getDefaultNavigationTarget(data: any): { screen: string; params?: any } {
    if (!data) return { screen: 'orders' };

    if (data.transactionId) {
      // Determine which tab based on role
      const tab = data.role === 'SELLER' ? 'sales' : 'purchases';
      return {
        screen: 'orders',
        params: {
          tab,
          transactionId: data.transactionId,
          filter: 'in_progress' // Show "En cours" transactions
        }
      };
    }

    if (data.productId) {
      return {
        screen: 'product',
        params: { productId: data.productId }
      };
    }

    return { screen: 'orders' };
  }
}