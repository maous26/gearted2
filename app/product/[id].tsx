import { useStripe, PaymentSheet } from "@stripe/stripe-react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RatingModal from "../../components/RatingModal";
import { useTheme } from "../../components/ThemeProvider";
import { UserBadge } from "../../components/UserBadge";
import { useProduct } from "../../hooks/useProducts";
import stripeService from "../../services/stripe";
import { THEMES } from "../../themes";

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const params = useLocalSearchParams();
  const productId = String(params.id || "");
  const { data: product, isLoading, isError } = useProduct(productId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const images = useMemo(() => {
    const arr = product?.images || [];
    return arr.filter((u: string) => typeof u === 'string' && !u.startsWith('file://'));
  }, [product]);

  /**
   * Gérer l'achat du produit avec Stripe Payment Sheet
   */
  const handleBuyNow = async () => {
    if (!product) return;

    setIsProcessingPayment(true);

    try {
      // 1. Créer le Payment Intent sur le backend
      const paymentData = await stripeService.createPaymentIntent(
        product.id,
        product.price,
        'eur'
      );

      // 2. Initialiser le Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: 'Gearted',
        returnURL: 'gearted://payment-success',
        // Désactiver complètement la collecte d'adresse de billing
        billingDetailsCollectionConfiguration: {
          name: PaymentSheet.CollectionMode.NEVER,
          email: PaymentSheet.CollectionMode.NEVER,
          phone: PaymentSheet.CollectionMode.NEVER,
          address: PaymentSheet.AddressCollectionMode.NEVER,
          attachDefaultsToPaymentMethod: true,
        },
        // Fournir des valeurs par défaut (obligatoire avec NEVER)
        defaultBillingDetails: {
          name: 'Client',
          email: 'client@example.com',
          address: {
            country: 'FR',
            postalCode: '00000',
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
        // L'utilisateur a annulé ou une erreur s'est produite
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur de paiement', presentError.message);
        }
        return;
      }

      // 4. Paiement réussi !
      setHasPurchased(true);

      Alert.alert(
        'Achat confirmé ! 🎉',
        `Votre achat de "${product.title}" a été confirmé.\n\nVous avez payé ${paymentData.totalCharge.toFixed(2)} € (dont ${paymentData.buyerFee.toFixed(2)} € de frais de service).\n\nVeuillez maintenant entrer votre adresse de livraison.`,
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
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessingPayment(false);
    }
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

      {/* Actions Bottom Bar - Design moderne */}
      {!isLoading && !isError && product && (
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
              onPress={handleBuyNow}
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
        onSubmit={(r,c)=>{}}
        sellerName={product?.seller || 'Vendeur'}
      />
    </SafeAreaView>
  );
}
