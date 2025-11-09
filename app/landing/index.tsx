import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CategoryPill } from "../../components/CategoryPill";
import { CompatibilityTeaser } from "../../components/CompatibilityTeaser";
import { FeatureCard } from "../../components/FeatureCard";
import Hero from "../../components/Hero";
import { CATEGORIES } from "../../data";

// Professional landing page keeping existing theme concept (ranger/night) without changing theme definitions
export default function Landing() {
  const [mode] = useState<"ranger" | "night">("ranger");
  const isNight = mode === "night";
  const textColor = isNight ? "#ffffff" : "#4e5d2f";
  const muted = isNight ? "rgba(255,255,255,0.7)" : "rgba(78,93,47,0.7)";
  const subtleBg = isNight ? "#12171d" : "#f1f3ec";

  return (
    <ScrollView style={{ backgroundColor: isNight ? "#0f141a" : "#f7f8f3" }} contentContainerStyle={{ paddingBottom: 72 }}>

      {/* Hero section */}
      <Hero mode={mode} />

      {/* Value propositions */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
        <Text style={{ color: textColor, fontSize: 22, fontWeight: '700', marginBottom: 16 }}>Pourquoi choisir Gearted ?</Text>
        <FeatureCard
          theme={mode}
          icon="🛡️"
          title="Confiance & Sécurité"
          bullet={[
            "Vérification de la compatibilité des pièces pour éviter les erreurs coûteuses",
            "Système de réputation vendeur en approche",
            "Transparence sur l'état et l'historique du matériel (à venir)"
          ]}
        />
        <FeatureCard
          theme={mode}
          icon="⚙️"
          title="Axé sur la technique"
          bullet={[
            "Recherche rapide des références et pièces",
            "Fiches détaillées pour upgrades et maintenance",
            "Roadmap: suggestions d'améliorations compatibles"
          ]}
        />
        <FeatureCard
          theme={mode}
          icon="🔍"
          title="Trouver exactement ce qu'il vous faut"
          bullet={[
            "Catégories spécialisées: répliques, upgrades, optiques, équipements",
            "Filtrage par état, marque, type (extension future)",
            "Système de recherche optimisé pour les références connues"
          ]}
        />
      </View>

      {/* Compatibility teaser */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Vérifier la compatibilité avant d'acheter</Text>
        <CompatibilityTeaser theme={mode} />
      </View>

      {/* Popular categories */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Catégories populaires</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {CATEGORIES.slice(0, 8).map(cat => (
            <CategoryPill key={cat.slug} theme={mode} label={cat.label} icon={cat.icon} />
          ))}
        </View>
      </View>

      {/* How it works */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Comment ça marche</Text>
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
              backgroundColor: isNight ? '#22303d' : '#e1e6d5',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isNight ? '#2c3e50' : '#c9d2bb'
            }}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{item.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{item.title}</Text>
              <Text style={{ color: muted, fontSize: 13, lineHeight: 18 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Trust & Transparency */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Text style={{ color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Confiance & Transparence</Text>
        <View style={{ backgroundColor: subtleBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: isNight ? '#222d36' : '#d8dece' }}>
          {[
            'Compatibilité vérifiée (≥95%) — pas d’approximations',
            'Risque réduit d’achat de pièces inadaptées',
            'Plans: protection des transactions & système d’avis',
            'Focus sur le long terme: maintenance & optimisation'
          ].map(line => (
            <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ color: muted, fontSize: 13, flex: 1, lineHeight: 20 }}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Final CTA */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ backgroundColor: isNight ? '#1e262d' : '#e9eddc', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: isNight ? '#2b3842' : '#d6dcc8' }}>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Rejoignez la communauté</Text>
          <Text style={{ color: muted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>Créez un compte pour accéder aux fonctionnalités futures: notation vendeur, historique pièce, suivi maintenance.</Text>
          <TouchableOpacity style={{ backgroundColor: isNight ? '#2F5A3F' : '#4B5D3A', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Créer mon compte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Text style={{ color: muted, fontSize: 12, textAlign: 'center' }}>© {new Date().getFullYear()} Gearted — Airsoft Marketplace. Roadmap en évolution.</Text>
      </View>
    </ScrollView>
  );
}
