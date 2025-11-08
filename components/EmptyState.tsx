import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { THEMES } from '../themes';
import { useTheme } from './ThemeProvider';

type EmptyStateType = 'search' | 'favorites' | 'messages' | 'products' | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  customTitle?: string;
  customDescription?: string;
}

export const EmptyState = ({ 
  type, 
  onAction,
  customTitle,
  customDescription 
}: EmptyStateProps) => {
  const { theme } = useTheme();
  const t = THEMES[theme];

  const content = {
    search: {
      icon: '🔍',
      title: 'Aucun résultat',
      description: 'Essayez d\'autres mots-clés ou filtres',
      action: 'Effacer les filtres',
    },
    favorites: {
      icon: '⭐',
      title: 'Pas encore de favoris',
      description: 'Ajoutez des produits à vos favoris pour les retrouver facilement',
      action: 'Explorer les produits',
    },
    messages: {
      icon: '💬',
      title: 'Pas de conversations',
      description: 'Contactez des vendeurs pour démarrer une discussion',
      action: 'Parcourir les annonces',
    },
    products: {
      icon: '📦',
      title: 'Aucun produit',
      description: 'Commencez à publier des annonces pour vendre votre équipement',
      action: 'Publier une annonce',
    },
    error: {
      icon: '⚠️',
      title: 'Une erreur est survenue',
      description: 'Impossible de charger les données. Vérifiez votre connexion.',
      action: 'Réessayer',
    },
  }[type];

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
      }}
    >
      <Text style={{ fontSize: 64, marginBottom: 16 }}>{content.icon}</Text>
      
      <Text
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: t.heading,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {customTitle || content.title}
      </Text>
      
      <Text
        style={{
          fontSize: 15,
          color: t.muted,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 22,
        }}
      >
        {customDescription || content.description}
      </Text>

      {onAction && (
        <TouchableOpacity
          style={{
            backgroundColor: t.primaryBtn,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={onAction}
        >
          <Text
            style={{
              color: t.white,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {content.action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
