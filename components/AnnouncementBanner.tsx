import React from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { THEMES } from '../themes';
import { Advertisement, useAdvertisements, useTrackAdClick } from '../hooks/useProducts';
import { useTheme } from './ThemeProvider';

interface AnnouncementBannerProps {
  placement?: 'home' | 'landing' | 'sidebar' | 'banner';
}

export const AnnouncementBanner = ({ placement = 'banner' }: AnnouncementBannerProps) => {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { data: advertisements, isLoading } = useAdvertisements(placement);
  const trackClick = useTrackAdClick();

  if (isLoading || !advertisements || advertisements.length === 0) {
    return null;
  }

  const handleAdClick = async (ad: Advertisement) => {
    trackClick.mutate(ad.id);
    if (ad.link) {
      try {
        await Linking.openURL(ad.link);
      } catch (error) {
        console.error('Failed to open link:', error);
      }
    }
  };

  // Pour l'instant, on affiche seulement la première annonce
  const ad = advertisements[0];

  return (
    <TouchableOpacity
      onPress={() => handleAdClick(ad)}
      activeOpacity={ad.link ? 0.8 : 1}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: t.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Image
        source={{ uri: ad.imageUrl }}
        style={{
          width: '100%',
          height: 120,
          resizeMode: 'cover',
        }}
      />
      {(ad.title || ad.description) && (
        <View style={{ padding: 12 }}>
          {ad.title && (
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: t.heading,
                marginBottom: ad.description ? 4 : 0,
              }}
            >
              {ad.title}
            </Text>
          )}
          {ad.description && (
            <Text
              style={{
                fontSize: 14,
                color: t.muted,
              }}
              numberOfLines={2}
            >
              {ad.description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
