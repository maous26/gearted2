import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { THEMES } from '../themes';
import { useTheme } from './ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) => {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: t.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton = () => {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <View
      style={{
        backgroundColor: t.cardBg,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: t.border,
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <Skeleton width="100%" height={150} borderRadius={0} />

      {/* Content */}
      <View style={{ padding: 12 }}>
        {/* Title */}
        <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />

        {/* Price */}
        <Skeleton width="40%" height={22} style={{ marginBottom: 8 }} />

        {/* Location */}
        <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />

        {/* Button */}
        <Skeleton width="100%" height={36} borderRadius={8} />
      </View>
    </View>
  );
};

export const MessageCardSkeleton = () => {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <View
      style={{
        backgroundColor: t.cardBg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: t.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Avatar */}
      <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 12 }} />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
};
