import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [explosionAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation d'entrée : grenade qui tombe et tourne
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation (comme une grenade qui va exploser)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Démarre la pulsation après 1 seconde
    setTimeout(() => pulseAnimation.start(), 1000);

    // Animation d'explosion finale
    const timer = setTimeout(() => {
      pulseAnimation.stop();
      
      // Explosion : scale rapide et fade out
      Animated.parallel([
        Animated.timing(explosionAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setTimeout(onFinish, 100);
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, [onFinish, scaleAnim, rotateAnim, pulseAnim, explosionAnim]);

  if (!isVisible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = explosionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  { rotate },
                ],
                opacity,
              }
            ]}
          >
            <Image
              source={require("../assets/geartedicon2.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
});