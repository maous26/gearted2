import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [glitchAnim] = useState(new Animated.Value(0));
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [staticAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation de lignes de scan qui défilent
    const scanLineAnimation = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    scanLineAnimation.start();

    // Animation de glitch (distorsion horizontale)
    const glitchAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ])
    );
    glitchAnimation.start();

    // Animation de static/neige TV
    const staticAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(staticAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(staticAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ])
    );
    staticAnimation.start();

    // Fade in du logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Fin de l'animation après 3 secondes
    const timer = setTimeout(() => {
      scanLineAnimation.stop();
      glitchAnimation.stop();
      staticAnimation.stop();

      // Fade out final avec effet TV qui s'éteint
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setTimeout(onFinish, 100);
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      scanLineAnimation.stop();
      glitchAnimation.stop();
      staticAnimation.stop();
    };
  }, [onFinish, glitchAnim, scanLineAnim, staticAnim, fadeAnim]);

  if (!isVisible) return null;

  // Animation des lignes de scan qui descendent
  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, height],
  });

  // Glitch horizontal (décalage)
  const glitchTranslate = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  // Opacité du static/neige
  const staticOpacity = staticAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <View style={styles.container}>
      {/* Background avec effet vieux téléviseur */}
      <View style={styles.tvBackground}>
        {/* Effet de neige/static */}
        <Animated.View
          style={[
            styles.staticOverlay,
            {
              opacity: staticOpacity,
            },
          ]}
        />

        {/* Lignes de scan horizontales */}
        <View style={styles.scanLinesContainer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.scanLine,
                { top: (height / 20) * i },
              ]}
            />
          ))}
        </View>

        {/* Ligne de scan principale qui descend */}
        <Animated.View
          style={[
            styles.movingScanLine,
            {
              transform: [{ translateY: scanLineTranslate }],
            },
          ]}
        />

        {/* Logo avec effet de glitch */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: glitchTranslate }],
            },
          ]}
        >
          <Image
            source={require("../assets/GEARTEDicon9.png")}
            style={styles.logo}
            contentFit="contain"
          />

          {/* Effet de chromatic aberration (RGB split) pendant le glitch */}
          <Animated.View
            style={[
              styles.glitchLayer,
              {
                opacity: glitchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6],
                }),
              },
            ]}
          >
            <Image
              source={require("../assets/GEARTEDicon9.png")}
              style={[styles.logo, { tintColor: '#00FF00' }]}
              contentFit="contain"
            />
          </Animated.View>
        </Animated.View>

        {/* Vignette d'écran TV */}
        <View style={styles.vignette} />
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
  tvBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  staticOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  scanLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  movingScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  glitchLayer: {
    position: 'absolute',
    top: 2,
    left: -3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 40,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
  },
});
