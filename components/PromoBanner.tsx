import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Debug: Log when module loads
console.log('[PromoBanner] Module loaded');

interface BannerSettings {
  enabled: boolean;
  message: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  effect: 'none' | 'scroll' | 'blink';
}

const FONT_FAMILIES: Record<string, { fontFamily?: string; letterSpacing?: number; fontWeight?: '600' | '700' | 'bold' }> = {
  default: { fontWeight: '600', letterSpacing: 0 },
  stencil: { fontWeight: '700', letterSpacing: 3 },
  impact: { fontWeight: '700', letterSpacing: 1 },
  courier: { fontFamily: 'Courier', fontWeight: '700', letterSpacing: 0 },
  'arial-black': { fontWeight: '700', letterSpacing: 1 },
};

export default function PromoBanner() {
  // Debug: Log when component mounts
  console.log('[PromoBanner] Component function called');

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [textWidth, setTextWidth] = useState(0);

  const { data: bannerData, error, isLoading, isFetching } = useQuery({
    queryKey: ['promo-banner'],
    queryFn: async () => {
      console.log('[PromoBanner] queryFn executing - fetching banner settings...');
      const response: any = await api.get('/api/settings/promo-banner');
      console.log('[PromoBanner] API Response:', JSON.stringify(response));
      return response.banner as BannerSettings;
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Debug logging on mount and state changes
  useEffect(() => {
    console.log('[PromoBanner] useEffect - Mount/Update');
    console.log('[PromoBanner] State:', { bannerData, error: error?.message, isLoading, isFetching });
  }, [bannerData, error, isLoading, isFetching]);

  const banner = bannerData || {
    enabled: false,
    message: '',
    backgroundColor: '#FFB800',
    textColor: '#000000',
    fontFamily: 'default',
    effect: 'none',
  };

  // Scroll animation
  useEffect(() => {
    if (banner.enabled && banner.effect === 'scroll' && textWidth > 0) {
      scrollAnim.setValue(0);
      const animation = Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -textWidth,
          duration: Math.max(textWidth * 30, 5000), // Speed based on text length
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [banner.enabled, banner.effect, textWidth, scrollAnim]);

  // Blink animation
  useEffect(() => {
    if (banner.enabled && banner.effect === 'blink') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [banner.enabled, banner.effect, blinkAnim]);

  // Always log rendering decision
  console.log('[PromoBanner] Render check:', {
    isLoading,
    hasError: !!error,
    bannerEnabled: banner.enabled,
    bannerMessage: banner.message,
  });

  if (!banner.enabled || !banner.message) {
    console.log('[PromoBanner] Returning null - banner disabled or no message');
    return null;
  }

  console.log('[PromoBanner] Rendering visible banner:', banner);

  const fontStyle = FONT_FAMILIES[banner.fontFamily] || FONT_FAMILIES.default;

  const textStyle = {
    color: banner.textColor,
    fontSize: 14,
    ...fontStyle,
  };

  const renderContent = () => {
    if (banner.effect === 'scroll') {
      return (
        <View style={styles.scrollContainer}>
          <Animated.View
            style={[
              styles.scrollContent,
              { transform: [{ translateX: scrollAnim }] },
            ]}
          >
            <Text
              style={[styles.text, textStyle]}
              onLayout={(e) => setTextWidth(e.nativeEvent.layout.width + 100)}
            >
              {banner.message}
              {'     •     '}
              {banner.message}
              {'     •     '}
              {banner.message}
              {'     •     '}
            </Text>
          </Animated.View>
        </View>
      );
    }

    if (banner.effect === 'blink') {
      return (
        <Animated.Text style={[styles.text, textStyle, { opacity: blinkAnim }]}>
          {banner.message}
        </Animated.Text>
      );
    }

    return <Text style={[styles.text, textStyle]}>{banner.message}</Text>;
  };

  return (
    <View style={[styles.container, { backgroundColor: banner.backgroundColor }]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  scrollContainer: {
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
});
