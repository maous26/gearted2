import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RatingModal from "../../components/RatingModal";
import { PaymentSheetConstants } from "../../components/StripeConstants";
import { isStripeAvailable, useConditionalStripe } from "../../components/StripeWrapper";
import { useTheme } from "../../components/ThemeProvider";
import { useUser } from "../../components/UserProvider";
import { useDeleteProduct, useProduct } from "../../hooks/useProducts";
import { usePurchaseFlow } from "../../hooks/usePurchaseFlow";
import api from "../../services/api";
import stripeService from "../../services/stripe";
import { THEMES } from "../../themes";
import { PLACEHOLDER_IMAGE } from "../../utils/imageUtils";

interface ShippingRate {
  rateId: string;
  provider: string;
  servicelevelName: string;
  amount: string;
  currency: string;
  estimatedDays: number;
}

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { user } = useUser();
  const params = useLocalSearchParams();
  const productId = String(params.id || "");
  const { data: product, isLoading, isError } = useProduct(productId);

  // Vérifier si l'utilisateur actuel est le vendeur
  const isOwnProduct = user?.id && product?.sellerId && user.id === product.sellerId;
  const canEditOrDelete = isOwnProduct && product?.status !== 'SOLD';

  const deleteProductMutation = useDeleteProduct();
  const purchaseFlow = usePurchaseFlow();
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useConditionalStripe();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [wantExpertise, setWantExpertise] = useState(false);
  const [wantInsurance, setWantInsurance] = useState(false);

  // Livraison
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [hasShippingCategory, setHasShippingCategory] = useState<boolean | null>(null);
  const [needsCustomDimensions, setNeedsCustomDimensions] = useState(false);

  // Protection/Insurance settings from backend
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [protectionPrice, setProtectionPrice] = useState(4.99);

  // Commission settings from backend
  const [buyerFeeEnabled, setBuyerFeeEnabled] = useState(true);
  const [buyerFeePercent, setBuyerFeePercent] = useState(5);

  const EXPERTISE_PRICE = 19.90;
  const INSURANCE_PRICE = protectionPrice;

  // Charger les settings de protection et commissions au montage
  useEffect(() => {
    const loadSettings = async () => {
      // Protection settings
      try {
        const response = await api.get<{ success: boolean; settings?: { enabled: boolean; price: number } }>('/api/settings/protection');
        if (response.success && response.settings) {
          setProtectionEnabled(response.settings.enabled);
          setProtectionPrice(response.settings.price);
        }
      } catch (error) {
        console.error('[Product] Failed to load protection settings:', error);
      }

      // Commission settings
      try {
        const response = await api.get<{ success: boolean; settings?: { buyerEnabled: boolean; buyerFeePercent: number } }>('/api/settings/commissions');
        if (response.success && response.settings) {
          setBuyerFeeEnabled(response.settings.buyerEnabled !== false);
          setBuyerFeePercent(response.settings.buyerFeePercent || 5);
        }
      } catch (error) {
        console.error('[Product] Failed to load commission settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Charger les tarifs de livraison quand le modal s'ouvre
  useEffect(() => {
    if (showPurchaseModal && product && !product.handDelivery) {
      loadShippingRates();
    }
  }, [showPurchaseModal, product]);

  const loadShippingRates = async () => {
    if (!product) return;
    setLoadingRates(true);
    try {
      const response = await api.get<{
        success: boolean;
        rates?: ShippingRate[];
        error?: string;
        hasShippingCategory?: boolean;
        needsCustomDimensions?: boolean;
      }>(`/api/shipping/rates/product/${product.id}`);

      if (response.success && response.rates) {
        setShippingRates(response.rates);
        setHasShippingCategory(true);
        setNeedsCustomDimensions(false);
        // Sélectionner le premier tarif par défaut
        if (response.rates.length > 0) {
          setSelectedShippingRate(response.rates[0]);
        }
      } else {
        setHasShippingCategory(response.hasShippingCategory ?? false);
        setNeedsCustomDimensions(response.needsCustomDimensions ?? false);
      }
    } catch (error: any) {
      console.error('[Product] Failed to load shipping rates:', error);
      setHasShippingCategory(false);
    } finally {
      setLoadingRates(false);
    }
  };

  const shippingCost = useMemo(() => {
    if (product?.handDelivery) return 0;
    return selectedShippingRate ? parseFloat(selectedShippingRate.amount) : 0;
  }, [product?.handDelivery, selectedShippingRate]);

  const purchaseSummary = useMemo(() => {
    if (!product) return null;
    const productPrice = product.price;
    // Calculer les frais acheteur selon les settings admin
    const buyerFee = buyerFeeEnabled ? parseFloat((productPrice * (buyerFeePercent / 100)).toFixed(2)) : 0;
    const total = productPrice + buyerFee;

    const expertiseCost = wantExpertise ? EXPERTISE_PRICE : 0;
    const insuranceCost = wantInsurance ? INSURANCE_PRICE : 0;
    const optionsTotal = expertiseCost + insuranceCost;
    return {
      productPrice,
      buyerFee,
      buyerFeeEnabled,
      total,
      expertiseCost,
      insuranceCost,
      optionsTotal,
      shippingCost,
      grandTotal: total + optionsTotal + shippingCost
    };
  }, [product, wantExpertise, wantInsurance, shippingCost, buyerFeeEnabled, buyerFeePercent]);

  const images = useMemo(() => {
    const arr = product?.images || [];
    // Filter out file:// URLs (local device paths not accessible to other users)
    const validImages = arr.filter((u: string) =>
      typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))
    );
    // If no valid images, return placeholder
    return validImages.length > 0 ? validImages : [PLACEHOLDER_IMAGE];
  }, [product]);

  /**
   * Gérer l'achat du produit avec Stripe Payment Sheet
   */
  const handleBuyPress = () => {
    if (!product) return;
    setShowPurchaseModal(true);
  };

  const processPayment = async () => {
    if (!product || !purchaseSummary) return;

    // Vérifier que la livraison est sélectionnée si pas remise en main propre
    if (!product.handDelivery && !selectedShippingRate) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de livraison');
      return;
    }

    setShowPurchaseModal(false);
    setIsProcessingPayment(true);

    try {
      // 1. Créer le Payment Intent sur le backend avec les options et livraison
      const paymentData = await stripeService.createPaymentIntent(
        product.id,
        product.price,
        'eur',
        {
          wantExpertise,
          wantInsurance,
          expertisePrice: wantExpertise ? EXPERTISE_PRICE : 0,
          insurancePrice: wantInsurance ? INSURANCE_PRICE : 0,
          // Frais de livraison
          shippingRateId: selectedShippingRate?.rateId || null,
          shippingCost: shippingCost,
          shippingProvider: selectedShippingRate?.provider || null,
          grandTotal: purchaseSummary.grandTotal
        }
      );

      // 2. Initialiser le Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: 'Gearted',
        returnURL: 'gearted://payment-success',
        billingDetailsCollectionConfiguration: {
          name: PaymentSheetConstants.CollectionMode.NEVER,
          email: PaymentSheetConstants.CollectionMode.NEVER,
          phone: PaymentSheetConstants.CollectionMode.NEVER,
          address: PaymentSheetConstants.AddressCollectionMode.NEVER,
          attachDefaultsToPaymentMethod: true,
        },
        defaultBillingDetails: {
          address: {
            country: 'FR',
          },
        },
        appearance: {
          colors: {
            primary: t.primaryBtn,
            background: t.cardBg,
            componentBackground: t.cardBg,
            componentBorder: t.border,
            componentDivider: t.border,
            primaryText: t.heading,
            secondaryText: t.muted,
            placeholderText: t.muted,
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
      });

      if (initError) {
        Alert.alert('Erreur', initError.message);
        return;
      }

      // 3. Présenter le Payment Sheet à l'utilisateur
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur de paiement', presentError.message);
        }
        return;
      }

      // 4. Paiement réussi côté Stripe!
      setHasPurchased(true);

      // 5. Démarrer le polling pour attendre la confirmation du webhook
      // Cela résout le problème de race condition entre le frontend et le webhook
      purchaseFlow.startPolling(
        paymentData.paymentIntentId,
        product.id,
        // onConfirmed - callback quand la transaction est confirmée
        (transactionId) => {
          console.log('[Purchase] Transaction confirmed:', transactionId);
          Alert.alert(
            'Achat confirmé ! 🎉',
            `Votre achat de "${product.title}" a été confirmé.\n\nVous avez payé ${paymentData.totalCharge.toFixed(2)} €.\n\nVeuillez maintenant entrer votre adresse de livraison.`,
            [
              {
                text: 'Entrer mon adresse',
                onPress: () => router.push({
                  pathname: '/shipping-address',
                  params: { transactionId: transactionId }
                }),
              },
            ]
          );
        },
        // onTimeout - callback si le polling expire
        () => {
          console.log('[Purchase] Polling timeout, proceeding anyway');
          // Même en cas de timeout, on navigue vers l'adresse
          // Le webhook finira par mettre à jour la transaction
          Alert.alert(
            'Achat en cours de confirmation',
            `Votre paiement a été reçu. La confirmation peut prendre quelques instants.\n\nVeuillez entrer votre adresse de livraison.`,
            [
              {
                text: 'Entrer mon adresse',
                onPress: () => router.push({
                  pathname: '/shipping-address',
                  params: { transactionId: paymentData.paymentIntentId }
                }),
              },
            ]
          );
        }
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  /**
   * Gérer la modification de l'annonce
   */
  const handleEditPress = () => {
    if (!product) return;
    router.push({
      pathname: '/edit-product' as any,
      params: { productId: product.id }
    });
  };

  /**
   * Gérer la suppression de l'annonce
   */
  const handleDeletePress = () => {
    if (!product) return;

    Alert.alert(
      'Supprimer l\'annonce',
      `Êtes-vous sûr de vouloir supprimer "${product.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteProductMutation.mutateAsync(product.id);
              Alert.alert(
                'Annonce supprimée',
                'Votre annonce a été supprimée avec succès.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer l\'annonce');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Header épuré */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: t.navBg,
        borderBottomWidth: 1,
        borderBottomColor: t.border + '20'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.cardBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}
        >
          <Text style={{ fontSize: 20, color: t.heading }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.cardBg,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => setIsFavorite(fav => !fav)}
        >
          <Text style={{ fontSize: 20 }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: t.muted, fontSize: 15 }}>Chargement...</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#E53935', fontSize: 15 }}>Erreur de chargement</Text>
          </View>
        )}

        {!isLoading && !isError && product && (
          <>
            {/* Galerie d'images */}
            <View style={{ position: 'relative' }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {(images.length ? images : [product.images?.[0]]).filter(Boolean).map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image as string }}
                    style={{ width, height: width * 0.8 }}
                    contentFit="cover"
                    priority={index === 0 ? "high" : "normal"}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ))}
              </ScrollView>

              {/* Indicateurs de pagination */}
              {images.length > 1 && (
                <View style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6
                }}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: currentImageIndex === index ? 24 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: currentImageIndex === index ? '#FFF' : 'rgba(255,255,255,0.4)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3
                      }}
                    />
                  ))}
                </View>
              )}

              {/* Badge condition */}
              {product.status !== 'SOLD' && (
                <View style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#4CAF50',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4
                }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 }}>
                    {product.condition?.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Badge VENDU */}
              {product.status === 'SOLD' && (
                <View style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 8
                }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 }}>
                    ✓ VENDU
                  </Text>
                </View>
              )}
            </View>

            {/* Contenu principal */}
            <View style={{ padding: 20 }}>
              {/* Titre */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{
                  fontSize: 26,
                  fontWeight: '700',
                  color: t.heading,
                  lineHeight: 32,
                  letterSpacing: -0.5
                }}>
                  {product.title}
                </Text>
              </View>

              {/* Prix */}
              <Text style={{
                fontSize: 34,
                fontWeight: '800',
                color: t.primaryBtn,
                marginBottom: 24,
                letterSpacing: -1
              }}>
                {`${Number(product.price).toFixed(2)} €`}
              </Text>

              {/* Infos localisation et date */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 24,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: t.border + '30'
              }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>📍</Text>
                    <Text style={{ fontSize: 15, color: t.heading, fontWeight: '500' }}>
                      {product.location}
                    </Text>
                  </View>
                  {product.handDelivery && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, marginRight: 6 }}>🤝</Text>
                      <Text style={{ fontSize: 13, color: '#4CAF50', fontWeight: '600' }}>
                        Remise en main propre
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: t.muted }}>
                  Publié récemment
                </Text>
              </View>

              {/* Section Vendeur - Version compacte */}
              <View style={{
                backgroundColor: t.cardBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: t.border + '30'
              }}>
                <Text style={{ fontSize: 12, color: t.muted, marginBottom: 12, fontWeight: '700', letterSpacing: 0.5 }}>
                  VENDEUR
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/50/4B5D3A/FFFFFF?text=U' }}
                    style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                    cachePolicy="memory-disk"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 2 }}>
                      {product.seller || 'Vendeur'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#FFB300', marginRight: 4 }}>⭐</Text>
                      <Text style={{ fontSize: 14, color: t.heading, fontWeight: '600' }}>
                        {product.rating}
                      </Text>
                      <Text style={{ fontSize: 13, color: t.muted, marginLeft: 4 }}>
                        / 5
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: t.heading,
                  marginBottom: 12,
                  letterSpacing: -0.3
                }}>
                  Description
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: t.heading,
                  lineHeight: 24,
                  opacity: 0.8
                }}>
                  {product.description}
                </Text>
              </View>

              {/* Caractéristiques */}
              {Array.isArray((product as any).features) && (product as any).features.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: t.heading,
                    marginBottom: 12,
                    letterSpacing: -0.3
                  }}>
                    Caractéristiques
                  </Text>
                  <View style={{
                    backgroundColor: t.cardBg,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: t.border + '30'
                  }}>
                    {((product as any).features as string[]).map((feature, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: index < (product as any).features.length - 1 ? 12 : 0,
                          paddingBottom: index < (product as any).features.length - 1 ? 12 : 0,
                          borderBottomWidth: index < (product as any).features.length - 1 ? 1 : 0,
                          borderBottomColor: t.border + '20'
                        }}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: t.primaryBtn + '20',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10
                        }}>
                          <Text style={{ fontSize: 12, color: t.primaryBtn, fontWeight: '700' }}>✓</Text>
                        </View>
                        <Text style={{ fontSize: 15, color: t.heading, flex: 1 }}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Spacer pour éviter que le contenu soit caché par les boutons */}
              <View style={{ height: 100 }} />
            </View>
          </>
        )}
      </ScrollView>

      {/* Actions Bottom Bar pour le VENDEUR - Modifier/Supprimer */}
      {!isLoading && !isError && product && canEditOrDelete && (
        <View style={{
          backgroundColor: t.navBg,
          borderTopWidth: 1,
          borderTopColor: t.border + '20',
          paddingHorizontal: 20,
          paddingVertical: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12
        }}>
          <Text style={{ fontSize: 12, color: t.muted, marginBottom: 12, textAlign: 'center' }}>
            C'est votre annonce
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: t.primaryBtn,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleEditPress}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.white }}>
                ✏️ Modifier
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isDeleting ? 0.6 : 1
              }}
              onPress={handleDeletePress}
              disabled={isDeleting}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>
                {isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions Bottom Bar - Design moderne (caché si c'est son propre produit) */}
      {!isLoading && !isError && product && !isOwnProduct && (
        <View style={{
          backgroundColor: t.navBg,
          borderTopWidth: 1,
          borderTopColor: t.border + '20',
          paddingHorizontal: 20,
          paddingVertical: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12
        }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: t.cardBg,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: t.border
              }}
              onPress={() => {
                router.push({
                  pathname: '/chat/new',
                  params: {
                    sellerId: product?.sellerId || product?.id,
                    sellerName: product?.seller,
                    sellerAvatar: `https://via.placeholder.com/50/4B5D3A/FFFFFF?text=${product?.seller?.charAt(0) || 'U'}`,
                    productId: product?.id,
                    productTitle: product?.title
                  }
                });
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.heading }}>
                💬 Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 2,
                backgroundColor: (isProcessingPayment || hasPurchased || product.status === 'SOLD') ? t.muted : t.primaryBtn,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: t.primaryBtn,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                opacity: (isProcessingPayment || product.status === 'SOLD') ? 0.6 : 1
              }}
              onPress={handleBuyPress}
              disabled={isProcessingPayment || hasPurchased || product.status === 'SOLD'}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.white }}>
                {product.status === 'SOLD' ? '❌ Produit vendu' : isProcessingPayment ? '⏳ Traitement...' : hasPurchased ? '✓ Acheté' : '💰 Acheter maintenant'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={(r, c) => { }}
        sellerName={product?.seller || 'Vendeur'}
      />

      {/* Purchase Summary Modal */}
      {showPurchaseModal && purchaseSummary && (
        <View style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <View style={{
            backgroundColor: t.cardBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 24
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: t.heading }}>Résumé de la commande</Text>
              <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
                <Text style={{ fontSize: 24, color: t.muted }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, color: t.muted }}>Produit</Text>
                <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600' }}>{purchaseSummary.productPrice.toFixed(2)} €</Text>
              </View>
              {purchaseSummary.buyerFeeEnabled && purchaseSummary.buyerFee > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, color: t.muted }}>Frais de service</Text>
                  <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600' }}>{purchaseSummary.buyerFee.toFixed(2)} €</Text>
                </View>
              )}

              {/* Section Livraison */}
              {!product?.handDelivery && (
                <>
                  <View style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.heading, marginBottom: 4 }}>📦 Mode de livraison</Text>

                  {loadingRates ? (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <ActivityIndicator color={t.primaryBtn} />
                      <Text style={{ color: t.muted, marginTop: 8 }}>Chargement des tarifs...</Text>
                    </View>
                  ) : hasShippingCategory === false ? (
                    <View style={{
                      backgroundColor: '#FFF3CD',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FFEEBA'
                    }}>
                      <Text style={{ color: '#856404', fontSize: 14, fontWeight: '600' }}>
                        ⚠️ Catégorie d'expédition non définie
                      </Text>
                      <Text style={{ color: '#856404', fontSize: 12, marginTop: 4 }}>
                        Ce produit n'a pas de catégorie d'expédition définie. Veuillez contacter le vendeur.
                      </Text>
                    </View>
                  ) : needsCustomDimensions ? (
                    <View style={{
                      backgroundColor: '#FFF3CD',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FFEEBA'
                    }}>
                      <Text style={{ color: '#856404', fontSize: 14, fontWeight: '600' }}>
                        ⚠️ Dimensions personnalisées requises
                      </Text>
                      <Text style={{ color: '#856404', fontSize: 12, marginTop: 4 }}>
                        Ce produit est en catégorie "Gros volume" et nécessite des dimensions personnalisées. L'achat sera possible une fois les dimensions saisies par le vendeur.
                      </Text>
                    </View>
                  ) : shippingRates.length > 0 ? (
                    shippingRates.map((rate) => (
                      <TouchableOpacity
                        key={rate.rateId}
                        onPress={() => setSelectedShippingRate(rate)}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: selectedShippingRate?.rateId === rate.rateId ? t.primaryBtn + '15' : 'transparent',
                          padding: 12,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: selectedShippingRate?.rateId === rate.rateId ? t.primaryBtn : t.border,
                          marginBottom: 8
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, color: t.heading, fontWeight: '600' }}>
                            {rate.provider}
                          </Text>
                          <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
                            {rate.servicelevelName} • {rate.estimatedDays} jour{rate.estimatedDays > 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 15, color: t.primaryBtn, fontWeight: '700' }}>
                            {parseFloat(rate.amount).toFixed(2)} €
                          </Text>
                          <View style={{
                            width: 24, height: 24, borderRadius: 12,
                            backgroundColor: selectedShippingRate?.rateId === rate.rateId ? t.primaryBtn : t.border,
                            justifyContent: 'center', alignItems: 'center'
                          }}>
                            {selectedShippingRate?.rateId === rate.rateId && (
                              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: t.muted, fontSize: 14 }}>Aucun tarif disponible</Text>
                  )}

                  {/* Afficher le coût de livraison sélectionné */}
                  {selectedShippingRate && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 16, color: t.muted }}>Livraison ({selectedShippingRate.provider})</Text>
                      <Text style={{ fontSize: 16, color: t.heading, fontWeight: '600' }}>{shippingCost.toFixed(2)} €</Text>
                    </View>
                  )}
                </>
              )}

              {/* Remise en main propre */}
              {product?.handDelivery && (
                <>
                  <View style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }} />
                  <View style={{
                    backgroundColor: '#D4EDDA',
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#C3E6CB'
                  }}>
                    <Text style={{ color: '#155724', fontSize: 14, fontWeight: '600' }}>
                      🤝 Remise en main propre
                    </Text>
                    <Text style={{ color: '#155724', fontSize: 12, marginTop: 4 }}>
                      Pas de frais de livraison. Vous devrez convenir d'un lieu de rencontre avec le vendeur.
                    </Text>
                  </View>
                </>
              )}

              {/* Options Premium */}
              <View style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.heading, marginBottom: 4 }}>Options Premium</Text>

              {/* Expertise Gearted */}
              <TouchableOpacity
                onPress={() => setWantExpertise(!wantExpertise)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: wantExpertise ? t.primaryBtn + '15' : 'transparent',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: wantExpertise ? t.primaryBtn : t.border
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: t.heading, fontWeight: '600' }}>🔍 Expertise Gearted</Text>
                  <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Vérification complète par nos experts</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 15, color: t.primaryBtn, fontWeight: '700' }}>{EXPERTISE_PRICE.toFixed(2)} €</Text>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: wantExpertise ? t.primaryBtn : t.border,
                    justifyContent: 'center', alignItems: 'center'
                  }}>
                    {wantExpertise && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Assurance Gearted - Only show if enabled in admin */}
              {protectionEnabled && (
                <TouchableOpacity
                  onPress={() => setWantInsurance(!wantInsurance)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: wantInsurance ? t.primaryBtn + '15' : 'transparent',
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: wantInsurance ? t.primaryBtn : t.border
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: t.heading, fontWeight: '600' }}>🛡️ Assurance Casse & Perte</Text>
                    <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Protection complète pendant l'expédition</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, color: t.primaryBtn, fontWeight: '700' }}>{INSURANCE_PRICE.toFixed(2)} €</Text>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: wantInsurance ? t.primaryBtn : t.border,
                      justifyContent: 'center', alignItems: 'center'
                    }}>
                      {wantInsurance && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Total options si sélectionnées */}
              {purchaseSummary.optionsTotal > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, color: t.muted }}>Options sélectionnées</Text>
                  <Text style={{ fontSize: 16, color: t.primaryBtn, fontWeight: '600' }}>+{purchaseSummary.optionsTotal.toFixed(2)} €</Text>
                </View>
              )}

              <View style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, color: t.heading, fontWeight: '800' }}>Total à payer</Text>
                <Text style={{ fontSize: 24, color: t.primaryBtn, fontWeight: '800' }}>{purchaseSummary.grandTotal.toFixed(2)} €</Text>
              </View>
            </View>

            {/* Bouton de paiement - désactivé si livraison requise mais non sélectionnée */}
            {(() => {
              const needsShipping = !product?.handDelivery;
              const shippingNotReady = needsShipping && (hasShippingCategory === false || needsCustomDimensions || !selectedShippingRate);
              const isDisabled = shippingNotReady || loadingRates;

              return (
                <>
                  <TouchableOpacity
                    style={{
                      backgroundColor: isDisabled ? t.muted : t.primaryBtn,
                      paddingVertical: 16,
                      borderRadius: 14,
                      alignItems: 'center',
                      shadowColor: isDisabled ? 'transparent' : t.primaryBtn,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDisabled ? 0 : 0.3,
                      shadowRadius: 8,
                      opacity: isDisabled ? 0.6 : 1,
                    }}
                    onPress={isDisabled ? undefined : processPayment}
                    disabled={isDisabled}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: t.white }}>
                      {loadingRates
                        ? 'Chargement...'
                        : hasShippingCategory === false
                          ? 'Catégorie d\'expédition requise'
                          : needsCustomDimensions
                            ? 'Dimensions requises'
                            : needsShipping && !selectedShippingRate
                              ? 'Sélectionnez une livraison'
                              : `Payer ${purchaseSummary.grandTotal.toFixed(2)} €`
                      }
                    </Text>
                  </TouchableOpacity>
                  {needsCustomDimensions && (
                    <Text style={{ textAlign: 'center', marginTop: 8, color: '#DC3545', fontSize: 12 }}>
                      Ce produit nécessite des dimensions personnalisées (gros volume)
                    </Text>
                  )}
                </>
              );
            })()}
            <Text style={{ textAlign: 'center', marginTop: 12, color: t.muted, fontSize: 12 }}>
              Paiement sécurisé via Stripe
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
