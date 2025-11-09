import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [staticAnim] = useState(new Animated.Value(0));
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [noiseOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation de neige/statique TV
    const staticAnimation = Animated.loop(
      Animated.timing(staticAnim, {
        toValue: 1,
        duration: 50, // Très rapide pour l'effet neige
        useNativeDriver: true,
      })
    );
    staticAnimation.start();

    // Animation de la ligne de scan
    const scanLineAnimation = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    scanLineAnimation.start();

    // Animation de glitch (perturbation)
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
        Animated.delay(Math.random() * 1000 + 500), // Pause aléatoire
      ])
    );
    glitchAnimation.start();

    // Animation de l'opacité du bruit
    const noiseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(noiseOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(noiseOpacity, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );
    noiseAnimation.start();

    const timer = setTimeout(() => {
      setIsVisible(false);
      staticAnimation.stop();
      scanLineAnimation.stop();
      glitchAnimation.stop();
      noiseAnimation.stop();
      setTimeout(onFinish, 300);
    }, 4500);

    return () => {
      clearTimeout(timer);
      staticAnimation.stop();
      scanLineAnimation.stop();
      glitchAnimation.stop();
      noiseAnimation.stop();
    };
  }, [onFinish, staticAnim, scanLineAnim, glitchAnim, noiseOpacity]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/geartedicon2.png")}
              style={styles.logo}
              contentFit="contain"
            />
            
            {/* Effet de neige TV (bruit statique) */}
            <Animated.View
              style={[
                styles.tvStatic,
                { 
                  opacity: noiseOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.15, 0.35],
                  })
                }
              ]}
            >
              {Array.from({ length: 100 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.staticDot,
                    {
                      top: Math.random() * height,
                      left: Math.random() * width,
                      opacity: Math.random(),
                      backgroundColor: Math.random() > 0.5 ? '#fff' : '#000',
                    }
                  ]}
                />
              ))}
            </Animated.View>

            {/* Lignes horizontales d'interférence */}
            <Animated.View
              style={[
                styles.interference,
                {
                  opacity: glitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6],
                  })
                }
              ]}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.interferenceLine,
                    {
                      top: (Math.random() * height),
                      height: Math.random() * 4 + 1,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                    }
                  ]}
                />
              ))}
            </Animated.View>

            {/* Effet de glitch RGB */}
            <Animated.View
              style={[
                styles.rgbGlitch,
                {
                  opacity: glitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                  transform: [{
                    translateX: glitchAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -5, 5],
                    })
                  }]
                }
              ]}
            >
              <Image
                source={require("../assets/geartedicon2.png")}
                style={[styles.logo, { tintColor: '#ff0000' }]}
                contentFit="contain"
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.rgbGlitch,
                {
                  opacity: glitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                  transform: [{
                    translateX: glitchAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 5, -5],
                    })
                  }]
                }
              ]}
            >
              <Image
                source={require("../assets/geartedicon2.png")}
                style={[styles.logo, { tintColor: '#00ffff' }]}
                contentFit="contain"
              />
            </Animated.View>

            {/* Ligne de scan TV */}
            <Animated.View
              style={[
                styles.scanLineContainer,
                {
                  transform: [{
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-height/2, height/2],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.scanLine} />
            </Animated.View>
          </View>
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
    backgroundColor: '#000',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  interference: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  interferenceLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  tvStatic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  staticDot: {
    position: 'absolute',
    width: 2,
    height: 2,
  },
  rgbGlitch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distortion: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '100%',
    height: 4,
                    backgroundColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});