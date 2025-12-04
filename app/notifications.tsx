import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import notificationService, { Notification } from '../services/notifications';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { notifications: notifs } = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }

      // Navigate based on notification data and role
      const data = notification.data;
      if (data?.transactionId) {
        // Determine which tab to show based on role
        const role = data?.role;
        if (role === 'SELLER') {
          // Navigate to Sales tab
          router.push({
            pathname: '/orders',
            params: { tab: 'sales', transactionId: data.transactionId }
          });
        } else if (role === 'BUYER') {
          // Navigate to Purchases tab
          router.push({
            pathname: '/orders',
            params: { tab: 'purchases', transactionId: data.transactionId }
          });
        } else {
          // Default: just go to orders
          router.push('/orders');
        }
      } else if (data?.productId) {
        router.push(`/product/${data.productId}`);
      }
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de marquer les notifications comme lues');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'SHIPPING_UPDATE':
        return 'cube-outline';
      case 'PAYMENT_UPDATE':
        return 'card-outline';
      case 'MESSAGE':
        return 'chatbubble-outline';
      case 'SUCCESS':
        return 'checkmark-circle-outline';
      case 'WARNING':
        return 'warning-outline';
      case 'ERROR':
        return 'close-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'SHIPPING_UPDATE':
        return '#3B82F6';
      case 'PAYMENT_UPDATE':
        return '#10B981';
      case 'MESSAGE':
        return '#8B5CF6';
      case 'SUCCESS':
        return '#10B981';
      case 'WARNING':
        return '#F59E0B';
      case 'ERROR':
        return '#EF4444';
      default:
        return t.primaryBtn;
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      onPress={() => handleNotificationPress(notification)}
      style={{
        backgroundColor: notification.isRead ? t.cardBg : t.accentBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: notification.isRead ? t.border : t.primaryBtn + '40',
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: getNotificationColor(notification.type) + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons
          name={getNotificationIcon(notification.type) as any}
          size={22}
          color={getNotificationColor(notification.type)}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: t.heading, marginBottom: 4 }}>
          {notification.title}
        </Text>
        <Text style={{ fontSize: 14, color: t.text, lineHeight: 20, marginBottom: 6 }}>
          {notification.message}
        </Text>
        <Text style={{ fontSize: 12, color: t.mutedText }}>
          {new Date(notification.createdAt).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {!notification.isRead && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t.primaryBtn,
            marginLeft: 8,
            marginTop: 8,
          }}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
            Notifications
          </Text>
        </View>

        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={{ padding: 8 }}>
            <Text style={{ color: t.primaryBtn, fontSize: 14, fontWeight: '600' }}>
              Tout lire
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={t.primaryBtn} />
            <Text style={{ marginTop: 16, fontSize: 14, color: t.mutedText }}>
              Chargement...
            </Text>
          </View>
        ) : notifications.length > 0 ? (
          notifications.map(renderNotification)
        ) : (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Ionicons name="notifications-off-outline" size={64} color={t.muted} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: t.heading,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              Aucune notification
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: t.mutedText,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Vous serez notifié ici des mises à jour importantes
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
