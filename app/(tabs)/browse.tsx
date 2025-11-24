import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { ProductCard } from "../../components/ProductCard";
import { ProductCardSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../components/ThemeProvider";
import { CATEGORIES } from "../../data";
import { useDebounce } from "../../hooks/useDebounce";
import { useInfiniteProducts } from "../../hooks/useProducts";
import { useProductsStore } from "../../stores/productsStore";
import { THEMES } from "../../themes";

export default function BrowseScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);
  const [showSortOptions, setShowSortOptions] = useState(false);

  const { filters, setFilters } = useProductsStore();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />

      {/* Search and Filters as ListHeaderComponent */}
      {!isLoading && !isError && allProducts.length > 0 ? (
        <FlatList
          data={allProducts}
          renderItem={({ item, index }) => <ProductCard product={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={() => (
            <View className="pt-4 mb-4">
              {/* Search Bar */}
              <View
                className="flex-row items-center rounded-xl border px-4 py-3 mb-4"
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.border,
                }}
              >
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: t.heading }}
                  placeholder="Rechercher des produits..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor={t.muted}
                />
                <TouchableOpacity
                  className="ml-2 px-3 py-1.5 rounded-md"
                  style={{ backgroundColor: t.primaryBtn }}
                >
                  <Text className="text-xs font-semibold" style={{ color: t.white }}>🔍</Text>
                </TouchableOpacity>
              </View>

              {/* Categories */}
              <Text
                className="text-base font-semibold mb-3"
                style={{ color: t.heading }}
              >
                Catégories
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.slug}
                    className="px-4 py-2 rounded-full border mr-2 flex-row items-center"
                    style={{
                      backgroundColor: filters.category === category.slug ? t.primaryBtn : t.cardBg,
                      borderColor: t.border,
                    }}
                    onPress={() => handleCategorySelect(
                      filters.category === category.slug ? null : category.slug
                    )}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: filters.category === category.slug ? t.white : t.heading,
                      }}
                    >
                      {category.icon} {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Sort Options */}
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="text-base font-semibold"
                  style={{ color: t.heading }}
                >
                  {totalCount} résultat{totalCount > 1 ? 's' : ''}
                </Text>

                <TouchableOpacity
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    backgroundColor: t.cardBg,
                    borderColor: t.border
                  }}
                  onPress={() => setShowSortOptions(true)}
                >
                  <Text className="text-xs" style={{ color: t.heading }}>
                    📊 Trier: {
                      filters.sortBy === 'recent' ? '🕒 Plus récent' :
                        filters.sortBy === 'price_low' ? '💰 Prix ↑' :
                          filters.sortBy === 'price_high' ? '💎 Prix ↓' :
                            '⭐ Note'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View className="py-5 items-center">
                <ActivityIndicator size="small" color={t.primaryBtn} />
              </View>
            ) : null
          }
        />
      ) : isLoading ? (
        <View className="flex-1 px-4 pt-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      ) : isError ? (
        <View className="flex-1 px-4 pt-4">
          <EmptyState
            type="error"
            onAction={refetch}
          />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-4">
          <EmptyState type="search" />
        </View>
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortOptions(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1}
          onPress={() => setShowSortOptions(false)}
        >
          <View
            className="rounded-xl p-2 min-w-[200px] border shadow-lg"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            {([
              { key: 'recent', label: '🕒 Plus récent' },
              { key: 'price_low', label: '💰 Prix croissant' },
              { key: 'price_high', label: '💎 Prix décroissant' },
              { key: 'rating', label: '⭐ Meilleure note' }
            ] as const).map((opt, index, array) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => handleSortSelect(opt.key)}
                className={`px-4 py-3.5 rounded-lg ${index < array.length - 1 ? 'mb-1' : ''}`}
                style={{
                  backgroundColor: filters.sortBy === opt.key ? t.primaryBtn + '20' : 'transparent',
                }}
              >
                <Text
                  className="text-[15px]"
                  style={{
                    color: filters.sortBy === opt.key ? t.primaryBtn : t.heading,
                    fontWeight: filters.sortBy === opt.key ? '600' : '400'
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}