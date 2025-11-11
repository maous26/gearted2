import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OfferTypeModal from "../../components/OfferTypeModal";
import RatingModal from "../../components/RatingModal";
import { useTheme } from "../../components/ThemeProvider";
import { useFavorites, useProduct, useToggleFavorite } from "../../hooks/useProducts";
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
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Favorites integration
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = favoritesData?.productIds ?? [];
  const isFavorite = favoriteIds.includes(productId);

  const images = useMemo(() => {
    const arr = product?.images || [];
    return arr.filter((u: string) => typeof u === 'string' && !u.startsWith('file://'));
  }, [product]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}> 
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: t.navBg + 'CC', borderBottomWidth: 1, borderBottomColor: t.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: t.heading, flex: 1 }}>Détail du produit</Text>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => toggleFavorite.mutate(productId)}>
          <Text style={{ fontSize: 20 }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {isLoading && <View style={{ padding: 16 }}><Text style={{ color: t.muted }}>Chargement...</Text></View>}
        {isError && !isLoading && <View style={{ padding: 16 }}><Text style={{ color: '#C62828' }}>Erreur de chargement</Text></View>}
        {!isLoading && !isError && product && (
          <>
            {/* Image Gallery */}
            <View>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }} scrollEventThrottle={16}>
                {(images.length ? images : [product.images?.[0]]).filter(Boolean).map((image, index) => (
                  <Image 
                    key={index} 
                    source={{ uri: image as string }} 
                    style={{ width, height: 300 }} 
                    contentFit="cover"
                    priority={index === 0 ? "high" : "normal"}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ))}
              </ScrollView>
              <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' }}>
                {(images.length ? images : [product.images?.[0]]).filter(Boolean).map((_, index) => (
                  <View key={index} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: currentImageIndex === index ? t.primaryBtn : 'rgba(255,255,255,0.5)', marginHorizontal: 4 }} />
                ))}
              </View>
              <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{product.condition}</Text>
              </View>
            </View>

            {/* Content */}
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: t.heading, flex: 1 }}>{product.title}</Text>
                {/* Listing Type Badge */}
                {product.listingType && product.listingType !== 'SALE' && (
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: product.listingType === 'TRADE' ? '#FF6B35' : '#4ECDC4',
                    borderRadius: 6,
                    marginLeft: 8
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFF' }}>
                      {product.listingType === 'TRADE' ? 'ÉCHANGE' : 'VENTE/ÉCHANGE'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: t.primaryBtn, marginBottom: 16 }}>
                {product.listingType === 'TRADE' ? 'Échange uniquement' : `${Number(product.price).toFixed(2)} €`}
              </Text>
              
              {/* Show tradeFor section if available */}
              {product.tradeFor && (
                <View style={{ 
                  backgroundColor: t.cardBg, 
                  borderRadius: 12, 
                  padding: 14, 
                  marginBottom: 16, 
                  borderWidth: 1, 
                  borderColor: '#4ECDC4'
                }}>
                  <Text style={{ fontSize: 14, color: t.muted, marginBottom: 8, fontWeight: '600' }}>
                    🔄 RECHERCHE EN ÉCHANGE
                  </Text>
                  <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22 }}>
                    {product.tradeFor}
                  </Text>
                </View>
              )}
              <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ fontSize: 14, color: t.muted, marginBottom: 12, fontWeight: '600' }}>VENDEUR</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/50/4B5D3A/FFFFFF?text=U' }} 
                      style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 4 }}>{product.seller || 'Vendeur'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#FFD700', marginRight: 4 }}>⭐ {product.rating}</Text>
                      </View>
                    </View>
                  </View>
                  {/* Bouton 'Contacter' supprimé, seul 'Message' reste */}
                </View>
              </View>
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
                  <Text style={{ fontSize: 16, color: t.heading }}>{product.location}</Text>
                  <Text style={{ fontSize: 14, color: t.muted, marginLeft: 'auto' }}>Publié récemment</Text>
                </View>
                {product.handDelivery && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>🤝</Text>
                    <Text style={{ fontSize: 15, color: t.heading }}>Remise en main propre disponible</Text>
                  </View>
                )}
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 8 }}>Description</Text>
                <Text style={{ fontSize: 15, color: t.heading, lineHeight: 22 }}>{product.description}</Text>
              </View>
              {/* Caractéristiques: afficher uniquement si présentes dans le produit */}
              {Array.isArray((product as any).features) && (product as any).features.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading, marginBottom: 8 }}>Caractéristiques</Text>
                  {((product as any).features as string[]).map((feature, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 16, marginRight: 8, color: t.primaryBtn }}>✓</Text>
                      <Text style={{ fontSize: 15, color: t.heading }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!hasPurchased && (
                <View style={{ backgroundColor: t.cardBg, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: t.border }}>
                  <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>💡 Le bouton "Noter le vendeur" apparaîtra après l'achat</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{ backgroundColor: t.navBg, borderTopWidth: 1, borderTopColor: t.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            backgroundColor: t.cardBg, 
            borderRadius: 12, 
            paddingVertical: 14, 
            alignItems: 'center', 
            borderWidth: 1, 
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
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.heading }}>💬 Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 2, backgroundColor: t.primaryBtn, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} 
          onPress={() => {
            if (product?.listingType === 'BOTH') {
              setShowOfferTypeModal(true);
            } else {
              setHasPurchased(true);
            }
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.white }}>
            {product?.listingType === 'TRADE' ? 'Proposer un échange' : product?.listingType === 'BOTH' ? 'Acheter ou échanger' : 'Acheter maintenant'}
          </Text>
        </TouchableOpacity>
      </View>

      <OfferTypeModal
        visible={showOfferTypeModal}
        onClose={() => setShowOfferTypeModal(false)}
        productTitle={product?.title || ''}
        price={product?.price || 0}
        tradeFor={product?.tradeFor}
        onBuy={() => {
          setHasPurchased(true);
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
        onTrade={() => {
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
      />

      <RatingModal visible={showRatingModal} onClose={() => setShowRatingModal(false)} onSubmit={(r,c)=>{}} sellerName={product?.seller || 'Vendeur'} />
    </SafeAreaView>
  );
}
