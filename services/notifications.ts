import api from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SHIPPING_UPDATE' | 'PAYMENT_UPDATE' | 'MESSAGE';
  isRead: boolean;
  data?: {
    transactionId?: string;
    productId?: string;
    productTitle?: string;
    [key: string]: any;
  };
  createdAt: string;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      const response = await api.get<{
        success: boolean;
        notifications: Notification[];
        unreadCount: number;
      }>('/api/notifications');

      return {
        notifications: response.notifications || [],
        unreadCount: response.unreadCount || 0,
      };
    } catch (error: any) {
      // Don't log 401 errors (unauthorized) as they are expected when user is not logged in
      if (error.response?.status !== 401) {
        console.error('[Notifications] Failed to get notifications:', error);
      }

      // Return empty result instead of throwing to prevent app crash
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
    } catch (error: any) {
      console.error('[Notifications] Failed to mark as read:', error);
      throw new Error(error.message || 'Erreur lors de la mise à jour de la notification');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/api/notifications/read-all');
    } catch (error: any) {
      console.error('[Notifications] Failed to mark all as read:', error);
      throw new Error(error.message || 'Erreur lors de la mise à jour des notifications');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
    } catch (error: any) {
      console.error('[Notifications] Failed to delete notification:', error);
      throw new Error(error.message || 'Erreur lors de la suppression de la notification');
    }
  }
}

export default new NotificationService();
