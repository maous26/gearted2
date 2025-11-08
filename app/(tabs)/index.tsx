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
import { BrandLogo } from "../../components/BrandLogo";
import { CategoryPill } from "../../components/CategoryPill";
import { CompatDrawer } from "../../components/CompatDrawer";
import { CompatibilityTeaser } from "../../components/CompatibilityTeaser";
import { useTheme } from "../../components/ThemeProvider";
import { CATEGORIES } from "../../data";
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
  <BrandLogo theme={theme} size="small" textVariant="subtitle" />
        <TouchableOpacity 
          style={{
            backgroundColor: t.primaryBtn,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12
          }}
          onPress={() => router.push("/(tabs)/sell")}
        >
          <Text style={{ color: t.white, fontWeight: '600' }}>Vendre</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Welcome Section */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}
        >
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 8
          }}>
            Bienvenue sur Gearted 👋
          </Text>
          <Text style={{
            fontSize: 16,
            color: t.muted,
            marginBottom: 16
          }}>
            Découvrez du matériel airsoft de qualité
          </Text>

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
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Catégories populaires
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8
          }}>
            {CATEGORIES.slice(0, 6).map((category) => (
              <CategoryPill
                key={category.slug}
                label={category.label}
                icon={category.icon}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.slug ? null : category.slug
                )}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Recent Listings */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Dernières annonces
          </Text>
          
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
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Actions rapides
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
            }}>
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