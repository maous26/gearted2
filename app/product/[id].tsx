import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RatingModal from "../../components/RatingModal";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

const { width } = Dimensions.get('window');

// Mock product detail
const PRODUCT_DETAIL = {
  id: "1",
  title: "AK-74 Kalashnikov Réplique",
  price: 280.00,
  condition: "Excellent",
  location: "Paris, 75001",
  seller: {
    name: "AirsoftPro92",
    rating: 4.8,
    totalSales: 127,
    avatar: "https://via.placeholder.com/50/4B5D3A/FFFFFF?text=AP"
  },
  images: [
    "https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=AK-74+1",
    "https://via.placeholder.com/400x300/556B2F/FFFFFF?text=AK-74+2",
    "https://via.placeholder.com/400x300/6B8E23/FFFFFF?text=AK-74+3"
  ],
  category: "repliques",
  description: "Réplique AK-74 en excellent état. Full metal, blowback. Utilisée seulement 3 fois en partie. Très précise, portée de 50m. Livré avec chargeur haute capacité et batterie neuve. Possibilité de remise en main propre sur Paris.",
  features: [
    "Full metal",
    "Blowback",
    "Portée 50m",
    "Batterie incluse",
    "Chargeur haute capacité"
  ],
  posted: "Il y a 2 jours"
};

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const params = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false); // TODO: Vérifier avec backend

  const handleRating = (rating: number, comment: string) => {
    console.log(`Rating: ${rating} stars - ${comment}`);
    // TODO: Envoyer au backend
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }} edges={['top']}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: t.heading,
          flex: 1
        }}>
          Détail du produit
        </Text>
        <TouchableOpacity style={{ padding: 8 }}>
          <Text style={{ fontSize: 20 }}>❤️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Image Gallery */}
        <View>
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
            {PRODUCT_DETAIL.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
            {PRODUCT_DETAIL.images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentImageIndex === index ? t.primaryBtn : 'rgba(255,255,255,0.5)',
                  marginHorizontal: 4
                }}
              />
            ))}
          </View>

          {/* Condition Badge */}
          <View style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: '#4CAF50',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8
          }}>
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
              {PRODUCT_DETAIL.condition}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Title & Price */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 8
          }}>
            {PRODUCT_DETAIL.title}
          </Text>

          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: t.primaryBtn,
            marginBottom: 16
          }}>
            {PRODUCT_DETAIL.price.toFixed(2)} €
          </Text>

          {/* Seller Info */}
          <View style={{
            backgroundColor: t.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: t.border
          }}>
            <Text style={{
              fontSize: 14,
              color: t.muted,
              marginBottom: 12,
              fontWeight: '600'
            }}>
              VENDEUR
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Image
                  source={{ uri: PRODUCT_DETAIL.seller.avatar }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 12
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: t.heading,
                    marginBottom: 4
                  }}>
                    {PRODUCT_DETAIL.seller.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#FFD700', marginRight: 4 }}>
                      ⭐ {PRODUCT_DETAIL.seller.rating}
                    </Text>
                    <Text style={{ fontSize: 14, color: t.muted }}>
                      · {PRODUCT_DETAIL.seller.totalSales} ventes
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: t.primaryBtn,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8
                }}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <Text style={{ color: t.white, fontWeight: '600', fontSize: 14 }}>
                  💬 Contacter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Rating Button (only if purchased) */}
            {hasPurchased && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: t.rootBg,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: t.border
                }}
                onPress={() => setShowRatingModal(true)}
              >
                <Text style={{ color: t.primaryBtn, fontWeight: '600', fontSize: 14 }}>
                  ⭐ Noter le vendeur après achat
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
            <Text style={{ fontSize: 16, color: t.heading }}>
              {PRODUCT_DETAIL.location}
            </Text>
            <Text style={{ fontSize: 14, color: t.muted, marginLeft: 'auto' }}>
              {PRODUCT_DETAIL.posted}
            </Text>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Description
            </Text>
            <Text style={{
              fontSize: 15,
              color: t.heading,
              lineHeight: 22
            }}>
              {PRODUCT_DETAIL.description}
            </Text>
          </View>

          {/* Features */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading,
              marginBottom: 8
            }}>
              Caractéristiques
            </Text>
            {PRODUCT_DETAIL.features.map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8, color: t.primaryBtn }}>✓</Text>
                <Text style={{ fontSize: 15, color: t.heading }}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Warning for demo */}
          {!hasPurchased && (
            <View style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: t.border
            }}>
              <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>
                💡 Le bouton "Noter le vendeur" apparaîtra après l'achat
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        backgroundColor: t.navBg,
        borderTopWidth: 1,
        borderTopColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 12
      }}>
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
          onPress={() => router.push('/(tabs)/messages')}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading
          }}>
            💬 Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 2,
            backgroundColor: t.primaryBtn,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center'
          }}
          onPress={() => {
            // TODO: Logique d'achat
            setHasPurchased(true);
          }}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.white
          }}>
            Acheter maintenant
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRating}
        sellerName={PRODUCT_DETAIL.seller.name}
      />
    </SafeAreaView>
  );
}
