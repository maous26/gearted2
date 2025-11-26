import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../themes';
import { Ionicons } from '@expo/vector-icons';
import transactionService, { Transaction } from '../services/transactions';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [statusFilter, setStatusFilter] = useState<'ongoing' | 'completed'>('ongoing');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Transaction[]>([]);

  useEffect(() => {
    loadOrders();
  }, [activeTab, statusFilter]);

  // Recharger automatiquement quand on revient sur l'écran
  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [activeTab, statusFilter])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);

      if (activeTab === 'sales') {
        const salesData = await transactionService.getMySales();
        console.log('[Orders] Sales data received:', JSON.stringify(salesData, null, 2));
        setSales(salesData);
      } else {
        const purchasesData = await transactionService.getMyPurchases();
        console.log('[Orders] Purchases data received:', JSON.stringify(purchasesData, null, 2));
        setPurchases(purchasesData);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les transactions');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: t.rootBg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: t.heading }}>
          Mes transactions
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs: Ventes / Achats */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
      }}>
        <TouchableOpacity
          onPress={() => setActiveTab('sales')}
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: activeTab === 'sales' ? t.primaryBtn : t.cardBg,
            borderRadius: 12,
            marginRight: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: activeTab === 'sales' ? '#FFF' : t.text,
          }}>
            📦 Mes ventes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('purchases')}
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: activeTab === 'purchases' ? t.primaryBtn : t.cardBg,
            borderRadius: 12,
            marginLeft: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: activeTab === 'purchases' ? '#FFF' : t.text,
          }}>
            🛍️ Mes achats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status filter: En cours / Terminées */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
      }}>
        <TouchableOpacity
          onPress={() => setStatusFilter('ongoing')}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: statusFilter === 'ongoing' ? t.accentBg : t.cardBg,
            borderRadius: 10,
            marginRight: 8,
            alignItems: 'center',
            borderWidth: statusFilter === 'ongoing' ? 2 : 1,
            borderColor: statusFilter === 'ongoing' ? t.primaryBtn : t.border,
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: statusFilter === 'ongoing' ? '600' : '500',
            color: statusFilter === 'ongoing' ? t.primaryBtn : t.text,
          }}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('completed')}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: statusFilter === 'completed' ? t.accentBg : t.cardBg,
            borderRadius: 10,
            marginLeft: 8,
            alignItems: 'center',
            borderWidth: statusFilter === 'completed' ? 2 : 1,
            borderColor: statusFilter === 'completed' ? t.primaryBtn : t.border,
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: statusFilter === 'completed' ? '600' : '500',
            color: statusFilter === 'completed' ? t.primaryBtn : t.text,
          }}>
            Terminées
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderCard = (order: any, isSale: boolean) => (
    <TouchableOpacity
      key={order.id}
      style={{
        backgroundColor: t.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: t.border,
      }}
      onPress={() => {
        // TODO: Navigate to order details
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {/* Product image */}
        <Image
          source={{ uri: order.product?.images?.[0] || 'https://via.placeholder.com/80' }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            backgroundColor: t.muted,
          }}
        />

        {/* Order info */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading,
            marginBottom: 4,
          }}>
            {order.product?.title}
          </Text>

          <Text style={{
            fontSize: 14,
            color: t.mutedText,
            marginBottom: 8,
          }}>
            {isSale ? `Acheteur: ${order.buyer?.username || 'Inconnu'}` : `Vendeur: ${order.seller?.username || 'Inconnu'}`}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: t.primaryBtn,
            }}>
              {(order.amount && typeof order.amount === 'number')
                ? order.amount.toFixed(2)
                : (order.product?.price && typeof order.product.price === 'number')
                  ? order.product.price.toFixed(2)
                  : 'N/A'} €
            </Text>

            {/* Status badge */}
            <View style={{
              backgroundColor: order.status === 'SUCCEEDED' ? '#10B981' : '#F59E0B',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                {order.status === 'SUCCEEDED' ? '✓ Payé' : '⏳ En attente'}
              </Text>
            </View>
          </View>

          {/* Tracking info if available */}
          {order.trackingNumber && (
            <View style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}>
              <Text style={{ fontSize: 12, color: t.mutedText }}>
                📍 Suivi: {order.trackingNumber}
              </Text>
            </View>
          )}

          {/* Action buttons for sellers - set dimensions */}
          {isSale && !order.trackingNumber && order.shippingAddress && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                backgroundColor: t.primaryBtn,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={() => {
                router.push({
                  pathname: '/seller-set-dimensions' as any,
                  params: {
                    transactionId: order.id,
                    productTitle: order.product?.title || 'Produit',
                    buyerName: order.buyer?.username || 'Inconnu',
                  },
                });
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                📦 Définir les dimensions du colis
              </Text>
            </TouchableOpacity>
          )}

          {/* Action buttons for buyers - choose shipping */}
          {!isSale && !order.trackingNumber && order.shippingAddress && (
            <>
              {order.product?.parcelDimensionsId ? (
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: t.primaryBtn,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/buyer-choose-shipping' as any,
                      params: {
                        transactionId: order.id,
                        productTitle: order.product?.title || 'Produit',
                        sellerName: order.seller?.username || 'Inconnu',
                      },
                    });
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                    📮 Choisir le mode de livraison
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    marginTop: 12,
                    backgroundColor: t.muted + '40',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: t.muted, fontWeight: '600', fontSize: 14 }}>
                    ⏳ En attente des dimensions du colis
                  </Text>
                  <Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>
                    Le vendeur doit d'abord renseigner les dimensions
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color={t.primaryBtn} />
          <Text style={{ color: t.mutedText, marginTop: 16 }}>
            Chargement...
          </Text>
        </View>
      );
    }

    const orders = activeTab === 'sales' ? sales : purchases;
    const filteredOrders = orders.filter(order => {
      if (statusFilter === 'ongoing') {
        return !order.trackingNumber && order.status === 'SUCCEEDED';
      }
      return order.trackingNumber || order.status === 'COMPLETED';
    });

    if (filteredOrders.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <Ionicons
            name={activeTab === 'sales' ? 'cube-outline' : 'bag-outline'}
            size={64}
            color={t.muted}
          />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: t.heading,
            marginTop: 16,
            textAlign: 'center',
          }}>
            Aucune {activeTab === 'sales' ? 'vente' : 'achat'}
          </Text>
          <Text style={{
            fontSize: 14,
            color: t.mutedText,
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 40,
          }}>
            {statusFilter === 'ongoing'
              ? 'Les transactions en cours apparaîtront ici'
              : 'Les transactions terminées apparaîtront ici'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primaryBtn} />
        }
      >
        {filteredOrders.map(order => renderOrderCard(order, activeTab === 'sales'))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
}
