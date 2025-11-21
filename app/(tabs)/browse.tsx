import { Image } from 'expo-image';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { ProductCardSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../components/ThemeProvider";
import { CATEGORIES } from "../../data";
import { useDebounce } from "../../hooks/useDebounce";
import { useFavorites, useInfiniteProducts, useToggleFavorite } from "../../hooks/useProducts";
import { Product, useProductsStore } from "../../stores/productsStore";
import { THEMES } from "../../themes";

export default function BrowseScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const { filters, setFilters, isFavorite } = useProductsStore();
  const toggleFavorite = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavorites();
  
  const t = THEMES[theme];

  // Handle category from navigation params
  useEffect(() => {
    if (params.category && typeof params.category === 'string') {
      setFilters({ category: params.category });
    }
  }, [params.category]);

  // Update filters when search or category changes
  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  useEffect(() => {
    setFilters({ category: filters.category || undefined });
  }, [filters.category, setFilters]);

  // Fetch products with React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteProducts(filters);

  // Get all products from pages
  const allProducts = data?.pages.flatMap(page => page.products) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleCategorySelect = (slug: string | null) => {
    setFilters({ category: slug || undefined });
  };

  const handleSortSelect = (key: 'recent' | 'price_low' | 'price_high' | 'rating') => {
    setFilters({ sortBy: key });
    setShowSortOptions(false);
  };

  const handleToggleFavorite = (productId: string) => {
    toggleFavorite.mutate(productId);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <TouchableOpacity style={{
      backgroundColor: t.cardBg,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden'
    }}
    onPress={() => router.push(`/product/${product.id}`)}
    >
      {/* Product Image */}
      <View style={{ position: 'relative', backgroundColor: '#f5f5f5' }}>
        <Image
          source={{ uri: product.images[0] }}
          style={{ width: '100%', height: 200 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(0,0,0,0.7)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6
        }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: 'white' }}>
            {product.condition}
          </Text>
        </View>
        
        {/* Favorite button */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFavorite(product.id);
          }}
        >
          <Text style={{ fontSize: 18 }}>
            {(favoriteIds.includes(product.id) || isFavorite(product.id)) ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
  </View>

  {/* Product Details */}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading,
            flex: 1
          }}>
            {product.title}
          </Text>
        </View>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: t.primaryBtn,
          marginBottom: 4
        }}>
          {product.price.toFixed(2)} €
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Text style={{
            fontSize: 12,
            color: t.muted
          }}>
            📍 {product.location}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#FFD700', marginRight: 4 }}>⭐</Text>
            <Text style={{ fontSize: 12, color: t.muted }}>
              {product.rating} • {product.seller}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={{
              flex: 1,
              backgroundColor: t.primaryBtn,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={() => router.push(`/product/${product.id}`)}
          >
            <Text style={{ color: t.white, fontWeight: '600', fontSize: 14 }}>
              Voir le détail
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              backgroundColor: t.cardBg,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => {
              // Redirection vers la page de nouveau message avec les infos du produit
              router.push({
                pathname: '/chat/new',
                params: {
                  sellerId: product.sellerId || product.id,
                  sellerName: product.seller,
                  sellerAvatar: `https://via.placeholder.com/40/4B5D3A/FFFFFF?text=${product.seller.charAt(0)}`,
                  productId: product.id,
                  productTitle: product.title
                }
              });
            }}
          >
            <Text style={{ fontSize: 18 }}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Search and Filters as ListHeaderComponent */}
      {!isLoading && !isError && allProducts.length > 0 ? (
        <FlatList
          data={allProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={() => (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* Search Bar */}
              <View style={{
                backgroundColor: t.cardBg,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: t.border,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: t.heading
                  }}
                  placeholder="Rechercher des produits..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor={t.muted}
                />
                <TouchableOpacity style={{
                  backgroundColor: t.primaryBtn,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6
                }}>
                  <Text style={{ color: t.white, fontWeight: '600', fontSize: 12 }}>🔍</Text>
                </TouchableOpacity>
              </View>

          {/* Categories */}
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading,
            marginBottom: 12
          }}>
            Catégories
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.slug}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: filters.category === category.slug ? t.primaryBtn : t.cardBg,
                  borderWidth: 1,
                  borderColor: t.border,
                  marginRight: 8
                }}
                onPress={() => handleCategorySelect(
                  filters.category === category.slug ? null : category.slug
                )}
              >
                <Text style={{
                  color: filters.category === category.slug ? t.white : t.heading,
                  fontWeight: '600',
                  fontSize: 12
                }}>
                  {category.icon} {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Options */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            zIndex: 1000
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: t.heading
            }}>
              {totalCount} résultat{totalCount > 1 ? 's' : ''}
            </Text>

            <View style={{ position: 'relative', zIndex: 1000 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: t.cardBg,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.border
                }}
                onPress={() => {
                  setShowSortOptions(v => !v);
                }}
              >
                <Text style={{ color: t.heading, fontSize: 12 }}>
                  📊 Trier: {
                    filters.sortBy === 'recent' ? '🕒 Plus récent' :
                    filters.sortBy === 'price_low' ? '💰 Prix ↑' :
                    filters.sortBy === 'price_high' ? '💎 Prix ↓' :
                    '⭐ Note'
                  }
                </Text>
              </TouchableOpacity>
              {showSortOptions && (
                <View style={{
                  position: 'absolute',
                  right: 0,
                  top: 36,
                  backgroundColor: t.cardBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.border,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 8,
                  elevation: 10,
                  zIndex: 2000
                }}>
                  {([
                    { key: 'recent', label: '🕒 Plus récent' },
                    { key: 'price_low', label: '💰 Prix croissant' },
                    { key: 'price_high', label: '💎 Prix décroissant' },
                    { key: 'rating', label: '⭐ Meilleure note' }
                  ] as const).map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => handleSortSelect(opt.key)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        minWidth: 160,
                        backgroundColor: filters.sortBy === opt.key ? t.sectionLight : t.cardBg
                      }}
                    >
                      <Text style={{ color: t.heading, fontSize: 14 }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
            </View>
          )}
          ListFooterComponent={() => 
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={t.primaryBtn} />
              </View>
            ) : null
          }
        />
      ) : isLoading ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <EmptyState 
            type="error" 
            onAction={refetch}
          />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <EmptyState type="search" />
        </View>
      )}
    </SafeAreaView>
  );
}