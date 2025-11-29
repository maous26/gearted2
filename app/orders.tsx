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
          <Ionicons name="arrow-back" size={24} color={t.heading} />
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
            color: activeTab === 'sales' ? '#FFF' : t.heading,
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
            color: activeTab === 'purchases' ? '#FFF' : t.heading,
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
            backgroundColor: statusFilter === 'ongoing' ? t.sectionLight : t.cardBg,
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
            color: statusFilter === 'ongoing' ? t.primaryBtn : t.heading,
          }}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('completed')}
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: statusFilter === 'completed' ? t.sectionLight : t.cardBg,
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
            color: statusFilter === 'completed' ? t.primaryBtn : t.heading,
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
            color: t.muted,
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

          {/* Tracking info with button to view label */}
          {order.trackingNumber && (
            <View style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}>
              <Text style={{ fontSize: 12, color: t.muted, marginBottom: 8 }}>
                📍 Suivi: {order.trackingNumber}
              </Text>

              {/* Button to view shipping label */}
              {!isSale && (
                <TouchableOpacity
                  style={{
                    backgroundColor: t.primaryBtn,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/shipping-label' as any,
                      params: {
                        trackingNumber: order.trackingNumber,
                        productTitle: order.product?.title || 'Produit',
                        carrier: order.trackingNumber?.split('-')[0] || 'Transporteur',
                      },
                    });
                  }}
                >
                  <Ionicons name="print-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>
                    Voir l'étiquette
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons for sellers - set dimensions */}
          {isSale && !order.trackingNumber && !order.product?.parcelDimensionsId && (
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
                console.log('[Orders] Opening dimensions screen for transaction:', order.id);
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
          
          {/* Show dimensions already set for seller */}
          {isSale && order.product?.parcelDimensionsId && (
            <View
              style={{
                marginTop: 12,
                backgroundColor: '#4CAF50' + '20',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#4CAF50',
              }}
            >
              <Text style={{ color: '#4CAF50', fontWeight: '600', fontSize: 14 }}>
                ✅ Dimensions du colis enregistrées
              </Text>
              <Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>
                L'acheteur peut maintenant générer son étiquette
              </Text>
            </View>
          )}

          {/* Action buttons for buyers - choose shipping */}
          {!isSale && !order.trackingNumber && (() => {
            const hasDimensions = !!order.product?.parcelDimensionsId;
            const hasAddress = !!order.shippingAddress;
            console.log(`[Orders/Button] Transaction ${order.id}: hasDimensions = ${hasDimensions}, hasAddress = ${hasAddress}`);

            // Si pas d'adresse, demander d'abord l'adresse
            if (!hasAddress) {
              return (
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: '#FF9800',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    console.log('[Orders] Opening address screen for transaction:', order.id);
                    router.push({
                      pathname: '/shipping-address' as any,
                      params: {
                        transactionId: order.id,
                        paymentIntentId: order.paymentIntentId,
                        productTitle: order.product?.title || 'Produit',
                      },
                    });
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                    📍 Renseigner l'adresse de livraison
                  </Text>
                </TouchableOpacity>
              );
            }

            // Si adresse OK mais pas de dimensions
            if (!hasDimensions) {
              return (
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
                    Le vendeur doit renseigner les dimensions
                  </Text>
                </View>
              );
            }

            // Si tout est OK, permettre de générer l'étiquette
            return (
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
                  console.log('[Orders] Opening shipping choice for transaction:', order.id);
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
                  📮 Générer l'étiquette d'expédition
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color={t.primaryBtn} />
          <Text style={{ color: t.muted, marginTop: 16 }}>
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
            color: t.muted,
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
