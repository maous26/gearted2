import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from '../components/EmptyState';
import { useTheme } from "../components/ThemeProvider";
import { Product, useProductsStore } from '../stores/productsStore';
import { THEMES } from "../themes";

// Mock data fallback (same as in useProducts hook)
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "AK-74 Kalashnikov Réplique",
    price: 289.99,
    condition: "Excellent",
    location: "Paris, 75001",
    seller: "AirsoftPro92",
    sellerId: "mock-user-1",
    rating: 4.8,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=AK-74"],
    category: "repliques",
    featured: true,
    description: "Réplique AEG en excellent état, peu utilisée",
    createdAt: new Date().toISOString()
  },
  {
    id: "2", 
    title: "Red Dot Sight - EOTech 552",
    price: 45.50,
    condition: "Très bon",
    location: "Lyon, 69000",
    seller: "TacticalGear",
    sellerId: "mock-user-2",
    rating: 4.9,
    images: ["https://via.placeholder.com/200x150/8B4513/FFFFFF?text=Red+Dot"],
    category: "optiques",
    featured: false,
    description: "Viseur holographique réplique EOTech",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    title: "Gilet Tactique MultiCam",
    price: 120.00,
    condition: "Neuf",
    location: "Marseille, 13000", 
    seller: "MilSimStore",
    sellerId: "mock-user-3",
    rating: 4.7,
    images: ["https://via.placeholder.com/200x150/556B2F/FFFFFF?text=Gilet"],
    category: "equipement",
    featured: true,
    description: "Gilet plate carrier MultiCam neuf, jamais utilisé",
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    title: "Billes 0.25g Bio (5000pcs)",
    price: 18.99,
    condition: "Neuf",
    location: "Toulouse, 31000",
    seller: "BioBB_Shop",
    sellerId: "mock-user-4",
    rating: 4.6,
    images: ["https://via.placeholder.com/200x150/2F4F4F/FFFFFF?text=Billes"],
    category: "munitions",
    featured: false,
    description: "Billes biodégradables 0.25g, sachet de 5000",
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    title: "M4A1 Custom Build",
    price: 450.00,
    condition: "Excellent",
    location: "Nice, 06000",
    seller: "CustomBuilds",
    sellerId: "mock-user-5",
    rating: 5.0,
    images: ["https://via.placeholder.com/200x150/4B5D3A/FFFFFF?text=M4A1"],
    category: "repliques", 
    featured: true,
    description: "M4A1 custom avec upgrades internes",
    createdAt: new Date().toISOString()
  },
  {
    id: "6",
    title: "Chargeur M4 120 billes",
    price: 12.50,
    condition: "Bon",
    location: "Bordeaux, 33000",
    seller: "PartsPro",
    sellerId: "mock-user-6",
    rating: 4.4,
    images: ["https://via.placeholder.com/200x150/696969/FFFFFF?text=Chargeur"],
    category: "pieces",
    featured: false,
    description: "Chargeur mid-cap 120 billes pour M4",
    createdAt: new Date().toISOString()
  }
];

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  
  const products = useProductsStore(state => state.products);
  const favorites = useProductsStore(state => state.favorites);
  const toggleFavorite = useProductsStore(state => state.toggleFavorite);
  
  // Use mock products if store is empty (backend unavailable)
  const allProducts = products.length > 0 ? products : MOCK_PRODUCTS;
  
  // Filter products to only show favorites
  const favoriteProducts = allProducts.filter(product => favorites.includes(product.id));

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{
        backgroundColor: t.cardBg,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: t.border,
        overflow: 'hidden',
        flexDirection: 'row'
      }}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={{ width: 120, height: 120 }}
      />
      
      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <View>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: t.heading,
            marginBottom: 4
          }} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={{
            fontSize: 13,
            color: t.muted,
            marginBottom: 8
          }}>
            {item.category} • {item.condition}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: t.primaryBtn
          }}>
            {item.listingType === 'TRADE' ? 'ÉCHANGE' : `${item.price}€`}
          </Text>
          
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: t.sectionLight
            }}
          >
            <Ionicons name="heart" size={20} color={t.primaryBtn} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: t.border
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 16,
            padding: 4
          }}
        >
          <Ionicons name="arrow-back" size={24} color={t.heading} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: t.heading,
          flex: 1
        }}>
          Mes favoris
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: t.muted,
          fontWeight: '600'
        }}>
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'article' : 'articles'}
        </Text>
      </View>

      {/* Products List */}
      {favoriteProducts.length === 0 ? (
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          <EmptyState
            type="favorites"
            onAction={() => router.push('/(tabs)/browse')}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={favoriteProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            padding: 20
          }}
        />
      )}
    </SafeAreaView>
  );
}
