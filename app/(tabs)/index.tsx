import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompatDrawer } from "../../components/CompatDrawer";
import { CompatibilityTeaser } from "../../components/CompatibilityTeaser";
import { useTheme } from "../../components/ThemeProvider";
import { UserBadge } from "../../components/UserBadge";
import { CATEGORIES } from "../../data";
import { useCategoryStats, useProducts } from "../../hooks/useProducts";
import { THEMES } from "../../themes";

const { width } = Dimensions.get('window');

export default function AuthenticatedHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCompatDrawerOpen, setIsCompatDrawerOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedWeaponType, setSelectedWeaponType] = useState("");
  
  const t = THEMES[theme];

  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ sortBy: 'recent' });
  const { data: categoryStats } = useCategoryStats();

  // Use real products from the database for featured listings
  const featuredListings = React.useMemo(() => {
    if (!productsData?.products) return [];
    // Filtrer les produits mis en avant, sinon prendre les 3 plus récents
    const featured = productsData.products.filter((p: any) => p.featured).slice(0, 3);
    if (featured.length > 0) return featured;
    return productsData.products.slice(0, 3);
  }, [productsData]);

  // Prioriser les vraies annonces (DB) dans "Dernières annonces"
  const recentListings = React.useMemo(() => {
    const all = productsData?.products ?? [];
    if (!all.length) return [];

    // Heuristique simple : les IDs Prisma (cuid) sont beaucoup plus longs que les IDs mock ("1", "10", ...)
    const real = all.filter((p: any) => typeof p.id === 'string' && p.id.length > 10);
    const realRecent = real.slice(0, 5);

    // Compléter avec des mocks si moins de 5 vraies annonces
    if (realRecent.length >= 5) return realRecent;

    const realIds = new Set(realRecent.map((p: any) => p.id));
    const mocks = all.filter((p: any) => !realIds.has(p.id));
    const mockRecent = mocks.slice(0, 5 - realRecent.length);

    return [...realRecent, ...mockRecent];
  }, [productsData]);

  const popularCategories = React.useMemo(() => {
    if (!categoryStats) return CATEGORIES.slice(0, 6);
    const topCategorySlugs = categoryStats.slice(0, 6).map(stat => stat.category);
    return CATEGORIES.filter(cat => topCategorySlugs.includes(cat.slug));
  }, [categoryStats]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      <ScrollView style={{ flex: 1 }}>
        {/* Search Bar */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}
        >
          <View style={{
            backgroundColor: t.white,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: t.heading,
                marginRight: 12
              }}
              placeholder="Rechercher du matériel..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={t.muted}
            />
            <Pressable 
              style={{
                backgroundColor: t.primaryBtn,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={() => {
                // ...existing code...
                router.push('/browse' as any);
              }}
            >
              <Text style={{ color: t.white, fontWeight: '600' }}>Chercher</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Featured Listings */}
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
            <Pressable onPress={() => {
              // ...existing code...
              router.push('/browse' as any);
            }}>
              <Text style={{ color: t.primaryBtn, fontSize: 14, fontWeight: '600' }}>
                Voir tout →
              </Text>
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {isLoadingProducts ? (
                // Loading skeleton
                [1, 2, 3].map((idx) => (
                  <View
                    key={`skeleton-${idx}`}
                    style={{
                      width: 240,
                      backgroundColor: t.cardBg,
                      borderRadius: 16,
                      overflow: 'hidden',
                      marginRight: idx < 3 ? 12 : 0,
                      opacity: 0.6
                    }}
                  >
                    <View style={{ width: '100%', height: 180, backgroundColor: t.border }} />
                    <View style={{ padding: 14 }}>
                      <View style={{ width: '80%', height: 16, backgroundColor: t.border, marginBottom: 8, borderRadius: 4 }} />
                      <View style={{ width: '40%', height: 20, backgroundColor: t.border, marginBottom: 8, borderRadius: 4 }} />
                      <View style={{ width: '60%', height: 14, backgroundColor: t.border, borderRadius: 4 }} />
                    </View>
                  </View>
                ))
              ) : featuredListings.length === 0 ? (
                // No products message
                <View style={{ 
                  width: 300, 
                  padding: 32, 
                  alignItems: 'center',
                  backgroundColor: t.cardBg,
                  borderRadius: 16
                }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
                  <Text style={{ fontSize: 16, color: t.muted, textAlign: 'center' }}>
                    Aucun produit en vedette pour le moment
                  </Text>
                </View>
              ) : featuredListings.map((product, idx) => (
                <Pressable
                  key={product.id}
                  style={{
                    width: 240,
                    backgroundColor: t.white,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: t.primaryBtn + '40',
                    overflow: 'hidden',
                    marginRight: idx < featuredListings.length - 1 ? 12 : 0
                  }}
                  onPress={() => {
                    // ...existing code...
                    router.push(`/product/${product.id}` as any);
                  }}
                >
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
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: t.white, fontSize: 12, marginRight: 4 }}>★</Text>
                    <Text style={{ color: t.white, fontSize: 11, fontWeight: '600' }}>
                      À LA UNE
                    </Text>
                  </View>

                  <View style={{ backgroundColor: '#f5f5f5' }}>
                    <Image
                      source={{ uri: (product.images?.[0] || 'https://via.placeholder.com/400x300/4B5D3A/FFFFFF?text=Photo') }}
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
                    </View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: t.primaryBtn,
                      marginBottom: 4
                    }}>
                      {`${Number(product.price).toFixed(2)} €`}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, color: t.muted }}>
                        📍 {product.location || 'Localisation non spécifiée'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: t.muted }}>
                        {product.seller}
                      </Text>
                      {(product.sellerRole || (product.sellerBadges && product.sellerBadges.length > 0)) && (
                        <UserBadge
                          role={product.sellerRole}
                          badge={product.sellerBadges?.[0]}
                          size="small"
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Compatibility */}
        <View style={{ 
          backgroundColor: t.sectionLight + '66', 
          paddingHorizontal: 16, 
          paddingVertical: 24 
        }}>
          <CompatibilityTeaser 
            theme={theme}
            onOpenDrawer={(item1, item2, result) => {
              // ...existing code...
            }}
          />
        </View>

        {/* Categories */}
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
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {popularCategories.map((category) => (
              <View key={category.slug} style={{ padding: 4 }}>
                <Pressable
                  style={{
                    backgroundColor: t.pillBg,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: t.border
                  }}
                  onPress={() => {
                    // ...existing code...
                    router.push('/browse' as any);
                  }}
                >
                  <Text style={{ marginRight: 8, fontSize: 16 }}>{category.icon}</Text>
                  <Text style={{ color: t.heading, fontWeight: '500', fontSize: 14 }}>
                    {category.label}
                  </Text>
                </Pressable>
              </View>
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
              <Text style={{ fontSize: 16, color: t.muted, textAlign: 'center' }}>
                Chargement...
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row' }}>
                {recentListings.map((product, index) => (
                  <Pressable
                    key={`${product.id}-${index}`}
                    style={{
                      width: 180,
                      backgroundColor: t.cardBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                      overflow: 'hidden',
                      marginRight: index < 4 ? 12 : 0
                    }}
                    onPress={() => {
                      // ...existing code...
                      router.push(`/product/${product.id}` as any);
                    }}
                  >
                    <View style={{ backgroundColor: '#f5f5f5' }}>
                      <Image
                        source={{ uri: product.images[0] }}
                        style={{ width: '100%', height: 140 }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                    </View>
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: t.heading,
                          flex: 1
                        }} numberOfLines={2}>
                          {product.title}
                        </Text>
                      </View>
                      {product.listingType && product.listingType !== 'SALE' && (
                        <View style={{ alignSelf: 'flex-start', marginVertical: 4 }}>
                          <View style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            backgroundColor: product.listingType === 'TRADE' ? '#FF6B35' : '#4ECDC4',
                            borderRadius: 8,
                          }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.3 }}>
                              {product.listingType === 'TRADE' ? '🔄 ÉCHANGE' : '💰 V/E'}
                            </Text>
                          </View>
                        </View>
                      )}
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: t.primaryBtn,
                        marginBottom: 4
                      }}>
                        {product.listingType === 'TRADE' ? '—' : `${product.price.toFixed(2)} €`}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.muted }}>
                        {product.location}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row' }}>
            <Pressable 
              style={{
                flex: 1,
                backgroundColor: t.primaryBtn,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginRight: 12
              }}
              onPress={() => router.push('/sell' as any)}
            >
              <Text style={{ color: t.white, fontWeight: '600' }}>
                Vendre un article
              </Text>
            </Pressable>
            
            <Pressable 
              style={{
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
            </Pressable>
          </View>
        </View>
      </ScrollView>

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
