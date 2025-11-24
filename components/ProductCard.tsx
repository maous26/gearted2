import { Image } from 'expo-image';
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFavorites, useToggleFavorite } from "../hooks/useProducts";
import { Product, useProductsStore } from "../stores/productsStore";
import { THEMES } from "../themes";
import { useTheme } from "./ThemeProvider";

interface ProductCardProps {
    product: Product;
    index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
    const { theme } = useTheme();
    const t = THEMES[theme];
    const { isFavorite } = useProductsStore();
    const toggleFavorite = useToggleFavorite();
    const { data: favoriteIds = [] } = useFavorites();

    const handleToggleFavorite = (e: any) => {
        e.stopPropagation();
        toggleFavorite.mutate(product.id);
    };

    const handleChatPress = (e: any) => {
        e.stopPropagation();
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
    };

    const isProductFavorite = favoriteIds.includes(product.id) || isFavorite(product.id);

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            className="mb-4 rounded-xl overflow-hidden border"
            style={{
                backgroundColor: t.cardBg,
                borderColor: t.border,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${product.id}`)}
            >
                {/* Product Image */}
                <View className="relative bg-gray-100">
                    <Image
                        source={{ uri: product.images[0] }}
                        style={{ width: '100%', height: 200 }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={200}
                    />

                    {/* Condition Badge */}
                    <View className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-md">
                        <Text className="text-[10px] font-semibold text-white">
                            {product.condition}
                        </Text>
                    </View>

                    {/* Sold Badge */}
                    {product.status === 'SOLD' && (
                        <View className="absolute top-2 right-2 bg-red-500 px-3 py-1.5 rounded-lg shadow-sm">
                            <Text className="text-xs font-bold text-white tracking-wider">
                                VENDU
                            </Text>
                        </View>
                    )}

                    {/* Favorite button */}
                    <TouchableOpacity
                        className="absolute bottom-2 right-2 bg-black/70 w-9 h-9 rounded-full items-center justify-center"
                        onPress={handleToggleFavorite}
                    >
                        <Text className="text-lg">
                            {isProductFavorite ? '❤️' : '🤍'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Product Details */}
                <View className="p-3">
                    <View className="flex-row items-center mb-1.5">
                        <Text
                            className="text-base font-semibold flex-1"
                            numberOfLines={1}
                            style={{ color: t.heading }}
                        >
                            {product.title}
                        </Text>
                    </View>

                    <Text
                        className="text-xl font-bold mb-1"
                        style={{ color: t.primaryBtn }}
                    >
                        {product.price.toFixed(2)} €
                    </Text>

                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xs" style={{ color: t.muted }}>
                            📍 {product.location}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-xs text-yellow-400 mr-1">⭐</Text>
                            <Text className="text-xs" style={{ color: t.muted }}>
                                {product.rating} • {product.seller}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            className="flex-1 py-2 rounded-lg items-center justify-center"
                            style={{ backgroundColor: t.primaryBtn }}
                            onPress={() => router.push(`/product/${product.id}`)}
                        >
                            <Text className="font-semibold text-sm" style={{ color: t.white }}>
                                Voir le détail
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-2 px-3 rounded-lg border items-center justify-center"
                            style={{
                                backgroundColor: t.cardBg,
                                borderColor: t.border,
                            }}
                            onPress={handleChatPress}
                        >
                            <Text className="text-lg">💬</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};
