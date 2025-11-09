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
import { BrandLogo } from "../components/BrandLogo";
import { CategoryPill } from "../components/CategoryPill";
import { CompatibilityTeaser } from "../components/CompatibilityTeaser";
import { FeatureCard } from "../components/FeatureCard";
import { CATEGORIES, FEATURE_CARDS, TRUST } from "../data";
import { THEMES, ThemeKey } from "../themes";

const { width } = Dimensions.get('window');

export default function GeartedLanding() {
  const [theme, setTheme] = useState<ThemeKey>("ranger");
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState("");
  
  const t = THEMES[theme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header (Logo left, auth actions right) */}
      <View
        style={{
          backgroundColor: t.navBg + "CC",
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
  <BrandLogo theme={theme} size="medium" textVariant="subtitle" />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: t.primaryBtn,
            }}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={{ color: t.primaryBtn, fontWeight: "600" }}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: t.primaryBtn,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
            }}
            onPress={() => router.push("/register" as any)}
          >
            <Text style={{ color: t.white, fontWeight: "600" }}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={[t.heroGradStart + 'CC', t.heroGradEnd + '66']}
          style={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 }}
        >
          <View>
            <Text style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: t.heading,
              textAlign: 'center',
              marginBottom: 18
            }}>
              Vendez & échangez votre matériel{'\n'}
              <Text style={{ color: t.primaryBtn }}>airsoft</Text>
            </Text>
            
            {/* Removed logo & descriptive paragraph per request */}

            {/* Key Points */}
            <View style={{ marginBottom: 24 }}>
              {[
                { label: "Publication en 2 minutes" },
                { label: "Paiement sécurisé (escrow)" },
                { label: "Profils vérifiés & avis" },
                { label: "Compatibilité technique" },
              ].map((item, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                >
                  <Text style={{ color: t.primaryBtn, marginRight: 8 }}>✓</Text>
                  <Text style={{ color: t.subtle, fontSize: 14 }}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Primary CTA Row */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 28,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: t.primaryBtn,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() => router.push("/register" as any)}
              >
                <Text style={{ color: t.white, fontWeight: "600", marginRight: 8 }}>+</Text>
                <Text style={{ color: t.white, fontWeight: "600" }}>Créer mon compte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.white,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 14,
                }}
                onPress={() => router.push("/login" as any)}
              >
                <Text style={{ color: t.heading, fontWeight: "600" }}>Connexion</Text>
              </TouchableOpacity>
            </View>

            {/* Search Section */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                backgroundColor: t.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                padding: 12,
                marginBottom: 12
              }}>
                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>🔍 Rechercher</Text>
                <TextInput
                  placeholder="Rechercher un modèle, ex. M4, G17, VSR-10..."
                  value={searchText}
                  onChangeText={setSearchText}
                  style={{ 
                    fontSize: 16, 
                    color: t.heading,
                    paddingVertical: 4
                  }}
                  placeholderTextColor={t.extraMuted}
                />
              </View>
              
              <View style={{
                backgroundColor: t.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                padding: 12,
                marginBottom: 12
              }}>
                <Text style={{ color: t.muted, fontSize: 12, marginBottom: 8 }}>📍 Localisation</Text>
                <TextInput
                  placeholder="Localisation (ex. Paris)"
                  value={location}
                  onChangeText={setLocation}
                  style={{ 
                    fontSize: 16, 
                    color: t.heading,
                    paddingVertical: 4
                  }}
                  placeholderTextColor={t.extraMuted}
                />
              </View>

              <TouchableOpacity style={{
                backgroundColor: t.primaryBtn,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center'
              }}>
                <Text style={{ color: t.white, fontWeight: '600', fontSize: 16 }}>Chercher</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Indicators */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {TRUST.map((item, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: t.primaryBtn,
                    marginRight: 8
                  }} />
                  <Text style={{ color: t.muted, fontSize: 12 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Categories Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Parcourir par catégorie
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12 
          }}>
            {CATEGORIES.map((category) => (
              <CategoryPill
                key={category.slug}
                label={category.label}
                icon={category.icon}
                theme={theme}
                onPress={() => console.log(`Pressed ${category.label}`)}
              />
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={{ 
          backgroundColor: t.sectionLight + '66', 
          paddingHorizontal: 16, 
          paddingVertical: 24 
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Pourquoi choisir Gearted ?
          </Text>
          
          <View style={{ gap: 16 }}>
            {FEATURE_CARDS.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                bullet={feature.bullet}
                icon={feature.icon}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Compatibility Section */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 12
          }}>
            Vérifier la compatibilité avant d'acheter
          </Text>
          <CompatibilityTeaser theme={theme} />
        </View>

        {/* Sample Listings */}
        <View style={{ 
          backgroundColor: t.sectionLight + '66', 
          paddingHorizontal: 16, 
          paddingVertical: 24 
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Annonces récentes
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12 
          }}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  width: (width - 44) / 2,
                  backgroundColor: t.white,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: t.border
                }}
              >
                <View style={{
                  height: 100,
                  backgroundColor: t.cardBg,
                  borderRadius: 12,
                  marginBottom: 12
                }} />
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center' 
                }}>
                  <View>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: t.heading 
                    }}>
                      Annonce #{i}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: t.extraMuted 
                    }}>
                      Très bon état
                    </Text>
                  </View>
                  <TouchableOpacity style={{
                    backgroundColor: t.pillBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}>
                    <Text style={{ 
                      fontSize: 12, 
                      color: t.heading,
                      fontWeight: '500' 
                    }}>
                      Voir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 16
          }}>
            Comment ça marche
          </Text>
          {[
            { step: '1', title: 'Créez votre compte', desc: 'Accédez à la marketplace et personnalisez votre profil.' },
            { step: '2', title: 'Trouvez du matériel', desc: 'Filtrez par catégories et références précises.' },
            { step: '3', title: 'Vérifiez la compatibilité', desc: 'Assurez-vous que les pièces correspondent avant l\'achat.' },
            { step: '4', title: 'Achetez & échangez en confiance', desc: 'Processus fluide et futur système d’évaluation.' }
          ].map(item => (
            <View key={item.step} style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start', gap: 12 }}>
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: t.cardBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: t.border
              }}>
                <Text style={{ color: t.heading, fontWeight: '700', fontSize: 16 }}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.heading, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trust & Transparency */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 12
          }}>
            Confiance & Transparence
          </Text>
          <View style={{ backgroundColor: t.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: t.border }}>
            {[
              'Compatibilité vérifiée (≥95%) — pas d’approximations',
              'Risque réduit d’achat de pièces inadaptées',
              'Plans: protection des transactions & système d’avis',
              'Focus sur le long terme: maintenance & optimisation'
            ].map(line => (
              <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={{ color: t.muted, fontSize: 13, flex: 1, lineHeight: 20 }}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{
          backgroundColor: t.navBg + 'CC',
          borderTopWidth: 1,
          borderTopColor: t.border,
          paddingHorizontal: 16,
          paddingVertical: 32,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: t.heading,
            marginBottom: 8
          }}>
            Gearted
          </Text>
          <Text style={{
            fontSize: 14,
            color: t.muted,
            textAlign: 'center'
          }}>
            Marketplace & échange de matériel airsoft{'\n'}
            sécurisé, simple, et pensé pour la communauté.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
