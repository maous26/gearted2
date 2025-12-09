import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../components/ThemeProvider';
import { useSocketContext } from '../components/SocketProvider';
import { useSocket } from '../hooks/useSocket';
import notificationService, { Notification } from '../services/notifications';
import { THEMES } from '../themes';

// Interface pour les notifications groupées par transaction
interface GroupedNotification {
  transactionId: string | null;
  productTitle: string;
  notifications: Notification[];
  latestNotification: Notification;
  unreadCount: number;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();
  const { isConnected } = useSocketContext();
  const { onNotification } = useSocket();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  // Regrouper les notifications par transactionId
  const groupedNotifications = useMemo((): GroupedNotification[] => {
    const groups = new Map<string, Notification[]>();
    const standaloneNotifs: Notification[] = [];

    notifications.forEach((notif) => {
      const transactionId = notif.data?.transactionId;
      if (transactionId) {
        const existing = groups.get(transactionId) || [];
        existing.push(notif);
        groups.set(transactionId, existing);
      } else {
        standaloneNotifs.push(notif);
      }
    });

    const result: GroupedNotification[] = [];

    // Ajouter les groupes de transactions
    groups.forEach((notifs, transactionId) => {
      // Trier par date décroissante
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestNotif = notifs[0];
      const unreadCount = notifs.filter((n) => !n.isRead).length;

      result.push({
        transactionId,
        productTitle: latestNotif.data?.productTitle || 'Transaction',
        notifications: notifs,
        latestNotification: latestNotif,
        unreadCount,
      });
    });

    // Ajouter les notifications standalone (sans transactionId)
    standaloneNotifs.forEach((notif) => {
      result.push({
        transactionId: null,
        productTitle: notif.title,
        notifications: [notif],
        latestNotification: notif,
        unreadCount: notif.isRead ? 0 : 1,
      });
    });

    // Trier par la date de la dernière notification
    result.sort(
      (a, b) =>
        new Date(b.latestNotification.createdAt).getTime() -
        new Date(a.latestNotification.createdAt).getTime()
    );

    return result;
  }, [notifications]);

  // Load notifications when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      loadNotifications();

      // Polling réduit à 30s car Socket.IO gère le temps réel
      // Le polling sert de fallback si Socket.IO est déconnecté
      pollingInterval.current = setInterval(() => {
        if (!isConnected) {
          loadNotificationsQuiet();
        }
      }, 30000);

      return () => {
        // Stop polling when screen loses focus
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      };
    }, [isConnected])
  );

  // 🔌 Socket.IO: Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    const unsubscribe = onNotification((socketNotif) => {
      console.log('[Notifications] Received via Socket.IO:', socketNotif.title);

      // Ajouter la nouvelle notification en haut de la liste
      const newNotif: Notification = {
        id: socketNotif.id,
        title: socketNotif.title,
        message: socketNotif.message,
        type: socketNotif.type as any,
        isRead: false,
        createdAt: socketNotif.createdAt,
        data: socketNotif.data,
      };

      setNotifications((prev) => {
        // Éviter les doublons
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    });

    return unsubscribe;
  }, [onNotification]);

  // Reload when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadNotificationsQuiet();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
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

  // Silent refresh - no loading indicator, no error alert (for polling)
  const loadNotificationsQuiet = async () => {
    try {
      const { notifications: notifs } = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch (error: any) {
      console.error('[Notifications] Silent refresh failed:', error);
      // Don't show alert on silent refresh failure
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Trouver le groupe de cette notification pour marquer toutes comme lues
      const transactionId = notification.data?.transactionId;
      if (transactionId) {
        // Marquer toutes les notifications non lues de ce groupe comme lues
        const unreadNotifs = notifications.filter(
          (n) => n.data?.transactionId === transactionId && !n.isRead
        );
        for (const notif of unreadNotifs) {
          await notificationService.markAsRead(notif.id);
        }
        setNotifications((prev) =>
          prev.map((n) =>
            n.data?.transactionId === transactionId ? { ...n, isRead: true } : n
          )
        );
      } else if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
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
            params: { tab: 'sales', transactionId: data.transactionId },
          });
        } else if (role === 'BUYER') {
          // Navigate to Purchases tab
          router.push({
            pathname: '/orders',
            params: { tab: 'purchases', transactionId: data.transactionId },
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

  // Rendre un groupe de notifications (ou une notification standalone)
  const renderGroupedNotification = (group: GroupedNotification) => {
    const { latestNotification, notifications: groupNotifs, unreadCount, productTitle } = group;
    const hasMultiple = groupNotifs.length > 1;
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        key={group.transactionId || latestNotification.id}
        onPress={() => handleNotificationPress(latestNotification)}
        style={{
          backgroundColor: hasUnread ? t.sectionLight : t.cardBg,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: hasUnread ? t.primaryBtn + '40' : t.border,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: getNotificationColor(latestNotification.type) + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={getNotificationIcon(latestNotification.type) as any}
            size={22}
            color={getNotificationColor(latestNotification.type)}
          />
        </View>

        <View style={{ flex: 1 }}>
          {/* Titre du groupe (produit) si plusieurs notifications */}
          {hasMultiple && group.transactionId && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Ionicons name="cube-outline" size={14} color={t.primaryBtn} style={{ marginRight: 4 }} />
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: t.primaryBtn }}
                numberOfLines={1}
              >
                {productTitle}
              </Text>
              <View
                style={{
                  backgroundColor: t.primaryBtn,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>
                  {groupNotifs.length} màj
                </Text>
              </View>
            </View>
          )}

          {/* Dernière notification */}
          <Text style={{ fontSize: 15, fontWeight: '600', color: t.heading, marginBottom: 4 }}>
            {latestNotification.title}
          </Text>
          <Text
            style={{ fontSize: 14, color: t.heading, lineHeight: 20, marginBottom: 6 }}
            numberOfLines={3}
          >
            {latestNotification.message}
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            {new Date(latestNotification.createdAt).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Badge non lu */}
        {hasUnread && (
          <View
            style={{
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: t.primaryBtn,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
              paddingHorizontal: unreadCount > 1 ? 4 : 0,
            }}
          >
            {unreadCount > 1 ? (
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{unreadCount}</Text>
            ) : (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            <Ionicons name="arrow-back" size={24} color={t.heading} />
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
            <Text style={{ marginTop: 16, fontSize: 14, color: t.muted }}>
              Chargement...
            </Text>
          </View>
        ) : groupedNotifications.length > 0 ? (
          groupedNotifications.map(renderGroupedNotification)
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
                color: t.muted,
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
