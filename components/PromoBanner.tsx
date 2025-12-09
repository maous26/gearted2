import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface BannerSettings {
  enabled: boolean;
  message: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  effect: 'none' | 'scroll' | 'blink';
}

const FONT_FAMILIES: Record<string, { fontFamily?: string; letterSpacing?: number; fontWeight?: '400' | '600' | '700' | 'bold'; textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none' }> = {
  default: { fontWeight: '600', letterSpacing: 0 },
  stencil: { fontWeight: '700', letterSpacing: 4, textTransform: 'uppercase' },
  impact: { fontWeight: '700', letterSpacing: 1 },
  courier: { fontFamily: 'Courier', fontWeight: '700', letterSpacing: 0 },
  'arial-black': { fontWeight: 'bold', letterSpacing: 1 },
  military: { fontWeight: '700', letterSpacing: 6, textTransform: 'uppercase' },
  elegant: { fontWeight: '400', letterSpacing: 2 },
  bold: { fontWeight: 'bold', letterSpacing: 0 },
  compact: { fontWeight: '700', letterSpacing: -0.5 },
  wide: { fontWeight: '600', letterSpacing: 8, textTransform: 'uppercase' },
  tactical: { fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
};

export default function PromoBanner() {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [textWidth, setTextWidth] = useState(0);

  const { data: bannerData } = useQuery({
    queryKey: ['promo-banner'],
    queryFn: async () => {
      const response: any = await api.get('/api/settings/promo-banner');
      return response.banner as BannerSettings;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

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
          duration: Math.max(textWidth * 30, 5000),
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

  if (!banner.enabled || !banner.message) {
    return null;
  }

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
