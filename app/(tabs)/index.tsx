import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryPill } from "../../components/CategoryPill";
import { CompatDrawer } from "../../components/CompatDrawer";
import { CompatibilityTeaser } from "../../components/CompatibilityTeaser";
import { useTheme } from "../../components/ThemeProvider";
import { CATEGORIES } from "../../data";
import { useCategoryStats, useProducts } from "../../hooks/useProducts";
import { THEMES } from "../../themes";

const { width } = Dimensions.get('window');

export default function AuthenticatedHome() {
  const { theme } = useTheme(); // global theme
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCompatDrawerOpen, setIsCompatDrawerOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedWeaponType, setSelectedWeaponType] = useState("");
  
  const t = THEMES[theme];

  // Fetch recent products
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ sortBy: 'recent' });
  
  // Fetch category stats to display popular categories
  const { data: categoryStats } = useCategoryStats();

  // Temporary featured listings (fake data)
  const featuredListings: Array<{
    id: string;
    title: string;
    price: number;
    location: string;
    condition: string;
    image: string;
    listingType?: 'SALE' | 'TRADE' | 'BOTH';
    tradeFor?: string;
  }> = [
    {
      id: 'featured-1',
      title: 'Tokyo Marui M4A1 MWS GBBR',
      price: 450.00,
      location: 'Paris, 75',
      condition: 'like-new',
      image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400',
      listingType: 'SALE',
      tradeFor: undefined
    },
    {
      id: 'featured-2',
      title: 'VFC HK416A5 AEG Noir',
      price: 380.00,
      location: 'Lyon, 69',
      condition: 'new',
      image: 'https://images.unsplash.com/photo-1584670961778-14523e170d7a?w=400',
      listingType: 'SALE',
      tradeFor: undefined
    },
    {
      id: 'featured-3',
      title: 'Cybergun FNX-45 Tactical GBB',
      price: 125.00,
      location: 'Marseille, 13',
      condition: 'good',
      image: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400',
      listingType: 'SALE',
      tradeFor: undefined
    }
  ];

  // Get top 6 categories by product count
  const popularCategories = React.useMemo(() => {
    if (!categoryStats) return CATEGORIES.slice(0, 6);
    
    const topCategorySlugs = categoryStats.slice(0, 6).map(stat => stat.category);
    return CATEGORIES.filter(cat => topCategorySlugs.includes(cat.slug));
  }, [categoryStats]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <ScrollView style={{ flex: 1 }}>
        {/* Welcome Section */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}
        >
          {/* Search Bar */}
          <View style={{
            backgroundColor: t.white,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: t.heading
              }}
              placeholder="Rechercher du matériel..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={t.muted}
            />
            <TouchableOpacity 
              style={{
                backgroundColor: t.primaryBtn,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={() => router.push("/(tabs)/browse")}
            >
              <Text style={{ color: t.white, fontWeight: '600' }}>Chercher</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Featured Listings (Annonces à la une) */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 24,
          backgroundColor: t.sectionLight + '33'
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 16 
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: t.heading,
              fontFamily: 'Oswald-Bold',
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}>
              ANNONCES À LA UNE
            </Text>
            <TouchableOpacity onPress={() => router.push('/browse')}>
              <Text style={{ color: t.primaryBtn, fontSize: 14, fontWeight: '600' }}>
                Voir tout →
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {featuredListings.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={{
                    width: 240,
                    backgroundColor: t.white,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: t.primaryBtn + '40',
                    overflow: 'hidden',
                    shadowColor: t.primaryBtn,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 5
                  }}
                  onPress={() => router.push(`/product/${product.id}` as any)}
                >
                  {/* Featured Badge */}
                  <View style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: t.primaryBtn,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    zIndex: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Text style={{ color: t.white, fontSize: 12 }}>★</Text>
                    <Text style={{ color: t.white, fontSize: 11, fontWeight: '600' }}>
                      À LA UNE
                    </Text>
                  </View>

                  <View style={{ backgroundColor: '#f5f5f5' }}>
                    <Image
                      source={{ uri: product.image }}
                      style={{ width: '100%', height: 180 }}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  </View>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: t.heading,
                          flex: 1
                        }}
                        numberOfLines={2}
                      >
                        {product.title}
                      </Text>
                      {/* Listing Type Badge */}
                      {product.listingType && product.listingType !== 'SALE' && (
                        <View style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          backgroundColor: product.listingType === 'TRADE' ? '#FF6B35' : '#4ECDC4',
                          borderRadius: 3,
                          marginLeft: 4
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#FFF' }}>
                            {product.listingType === 'TRADE' ? 'ÉCHANGE' : 'V/É'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: t.primaryBtn,
                      marginBottom: 4
                    }}>
                      {product.listingType === 'TRADE' ? 'Échange' : `${product.price.toFixed(2)} €`}
                    </Text>
                    {/* Show tradeFor if available */}
                    {product.tradeFor && (
                      <Text style={{
                        fontSize: 11,
                        color: t.muted,
                        fontStyle: 'italic',
                        marginBottom: 4
                      }} numberOfLines={1}>
                        🔄 {product.tradeFor}
                      </Text>
                    )}
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 4
                    }}>
                      <Text style={{ fontSize: 12, color: t.muted }}>📍</Text>
                      <Text style={{
                        fontSize: 13,
                        color: t.muted,
                        flex: 1
                      }}>
                        {product.location}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: t.sectionLight + '40',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{
                        fontSize: 11,
                        color: t.muted,
                        fontWeight: '500'
                      }}>
                        {product.condition === 'new' ? 'Neuf' : 
                         product.condition === 'like-new' ? 'Comme neuf' :
                         product.condition === 'good' ? 'Bon état' :
                         product.condition === 'fair' ? 'Correct' : 'Utilisé'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Compatibility Checker Section */}
        <View style={{ 
          backgroundColor: t.sectionLight + '66', 
          paddingHorizontal: 16, 
          paddingVertical: 24 
        }}>
          <CompatibilityTeaser 
            theme={theme}
            onOpenDrawer={(item1, item2, result) => {
              // Could open a detailed drawer here in the future
              console.log('Compatibility check:', item1.name, 'with', item2.name, '=', result.compatible);
            }}
          />
        </View>

        {/* Categories Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            CATÉGORIES POPULAIRES
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8
          }}>
            {popularCategories.map((category) => (
              <CategoryPill
                key={category.slug}
                label={category.label}
                icon={category.icon}
                onPress={() => {
                  // Navigate to browse page with category filter
                  router.push({
                    pathname: "/(tabs)/browse",
                    params: { category: category.slug }
                  });
                }}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Recent Listings */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            DERNIÈRES ANNONCES
          </Text>
          
          {isLoadingProducts ? (
            <View style={{
              backgroundColor: t.cardBg,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: t.border
            }}>
              <Text style={{
                fontSize: 16,
                color: t.muted,
                textAlign: 'center'
              }}>
                Chargement des annonces...
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {(productsData?.products || []).slice(0, 5).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={{
                      width: 180,
                      backgroundColor: t.cardBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      overflow: 'hidden'
                    }}
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <View style={{ backgroundColor: '#f5f5f5' }}>
                      <Image
                        source={{ uri: product.images[0] }}
                        style={{ width: '100%', height: 140 }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    </View>
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: t.heading,
                            flex: 1
                          }}
                          numberOfLines={2}
                        >
                          {product.title}
                        </Text>
                        {/* Listing Type Badge */}
                        {product.listingType && product.listingType !== 'SALE' && (
                          <View style={{
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            backgroundColor: product.listingType === 'TRADE' ? '#FF6B35' : '#4ECDC4',
                            borderRadius: 3,
                            marginLeft: 4
                          }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FFF' }}>
                              {product.listingType === 'TRADE' ? 'ÉCH' : 'V/É'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: t.primaryBtn,
                        marginBottom: 4
                      }}>
                        {product.listingType === 'TRADE' ? 'Échange' : `${product.price.toFixed(2)} €`}
                      </Text>
                      {product.tradeFor && (
                        <Text style={{
                          fontSize: 10,
                          color: t.muted,
                          fontStyle: 'italic',
                          marginBottom: 3
                        }} numberOfLines={1}>
                          🔄 {product.tradeFor}
                        </Text>
                      )}
                      <Text style={{
                        fontSize: 12,
                        color: t.muted
                      }}>
                        {product.location}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.heading,
            marginBottom: 16,
            fontFamily: 'Oswald-Bold',
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            ACTIONS RAPIDES
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: t.primaryBtn,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
              onPress={() => router.push("/(tabs)/sell")}
            >
              <Text style={{ color: t.white, fontWeight: '600' }}>
                Vendre un article
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: t.cardBg,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.border
            }}
            onPress={() => router.push('/favorites' as any)}
            >
              <Text style={{ color: t.heading, fontWeight: '600' }}>
                Mes favoris
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Compatibility Drawer */}
      <CompatDrawer
        isVisible={isCompatDrawerOpen}
        onClose={() => setIsCompatDrawerOpen(false)}
        theme={theme}
        manufacturer={selectedManufacturer}
        weaponType={selectedWeaponType}
      />
    </SafeAreaView>
  );
}