import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserBadgeProps {
  role?: string;
  badge?: string;
  size?: 'small' | 'medium' | 'large';
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role, badge, size = 'medium' }) => {
  // Déterminer le badge à afficher (priorité: badge custom > role)
  const displayBadge = badge || role;

  if (!displayBadge) return null;

  // Configuration des tailles
  const sizes = {
    small: { fontSize: 10, paddingH: 6, paddingV: 2, iconSize: 10 },
    medium: { fontSize: 11, paddingH: 8, paddingV: 3, iconSize: 12 },
    large: { fontSize: 12, paddingH: 10, paddingV: 4, iconSize: 14 }
  };

  const s = sizes[size];

  // Configuration des badges/rôles
  const badgeConfig: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    icon?: keyof typeof Ionicons.glyphMap;
  }> = {
    // Rôles Discord standards
    'admin': { label: 'Admin', color: '#DC2626', bgColor: '#FEE2E2', icon: 'shield-checkmark' },
    'moderator': { label: 'Modo', color: '#2563EB', bgColor: '#DBEAFE', icon: 'shield' },
    'verified': { label: 'Vérifié', color: '#059669', bgColor: '#D1FAE5', icon: 'checkmark-circle' },
    'premium': { label: 'Premium', color: '#7C3AED', bgColor: '#EDE9FE', icon: 'star' },
    'member': { label: 'Membre', color: '#6B7280', bgColor: '#F3F4F6' },

    // Badges spéciaux
    'founder': { label: 'Fondateur', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'trophy' },
    'developer': { label: 'Dev', color: '#10B981', bgColor: '#D1FAE5', icon: 'code-slash' },
    'supporter': { label: 'Supporter', color: '#EC4899', bgColor: '#FCE7F3', icon: 'heart' },
    'vip': { label: 'VIP', color: '#8B5CF6', bgColor: '#EDE9FE', icon: 'sparkles' },
  };

  const config = badgeConfig[displayBadge.toLowerCase()] || {
    label: displayBadge,
    color: '#6B7280',
    bgColor: '#F3F4F6'
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: config.bgColor,
      paddingHorizontal: s.paddingH,
      paddingVertical: s.paddingV,
      borderRadius: 4,
      marginLeft: 6
    }}>
      {config.icon && (
        <Ionicons
          name={config.icon}
          size={s.iconSize}
          color={config.color}
          style={{ marginRight: 3 }}
        />
      )}
      <Text style={{
        fontSize: s.fontSize,
        fontWeight: '600',
        color: config.color
      }}>
        {config.label}
      </Text>
    </View>
  );
};
