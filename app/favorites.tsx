import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from "react";
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
import { THEMES } from "../themes";
import { useProductsStore } from '../stores/productsStore';

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  
  const products = useProductsStore(state => state.products);
  const favorites = useProductsStore(state => state.favorites);
  const toggleFavorite = useProductsStore(state => state.toggleFavorite);
  
  // Filter products to only show favorites
  const favoriteProducts = products.filter(product => favorites.includes(product.id));

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
