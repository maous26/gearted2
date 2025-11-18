import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  // Multiple animated values for different blob shapes
  const [blob1Scale] = useState(new Animated.Value(1));
  const [blob1X] = useState(new Animated.Value(0));
  const [blob1Y] = useState(new Animated.Value(0));

  const [blob2Scale] = useState(new Animated.Value(1));
  const [blob2X] = useState(new Animated.Value(0));
  const [blob2Y] = useState(new Animated.Value(0));

  const [blob3Scale] = useState(new Animated.Value(1));
  const [blob3X] = useState(new Animated.Value(0));
  const [blob3Y] = useState(new Animated.Value(0));

  const [logoOpacity] = useState(new Animated.Value(0));
  const [logoScale] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Blob 1 animation (orange/green)
    const blob1Animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(blob1Scale, {
            toValue: 1.3,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Scale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob1X, {
            toValue: 50,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1X, {
            toValue: -30,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1X, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob1Y, {
            toValue: -40,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Y, {
            toValue: 40,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Y, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Blob 2 animation (olive/military green)
    const blob2Animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(blob2Scale, {
            toValue: 1.4,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Scale, {
            toValue: 0.9,
            duration: 3500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob2X, {
            toValue: -60,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(blob2X, {
            toValue: 40,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(blob2X, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob2Y, {
            toValue: 50,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Y, {
            toValue: -50,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Y, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Blob 3 animation (dark military)
    const blob3Animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(blob3Scale, {
            toValue: 1.2,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(blob3Scale, {
            toValue: 1.1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob3X, {
            toValue: 30,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(blob3X, {
            toValue: -50,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(blob3X, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blob3Y, {
            toValue: -30,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(blob3Y, {
            toValue: 30,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(blob3Y, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Logo fade in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        delay: 300,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start blob animations
    blob1Animation.start();
    blob2Animation.start();
    blob3Animation.start();

    // End animation
    const timer = setTimeout(() => {
      blob1Animation.stop();
      blob2Animation.stop();
      blob3Animation.stop();

      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(blob1Scale, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(blob2Scale, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(blob3Scale, {
          toValue: 0,
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
      blob1Animation.stop();
      blob2Animation.stop();
      blob3Animation.stop();
    };
  }, [onFinish, blob1Scale, blob1X, blob1Y, blob2Scale, blob2X, blob2Y, blob3Scale, blob3X, blob3Y, logoOpacity, logoScale]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        {/* Blob 1 - Orange/Green gradient */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob1,
            {
              transform: [
                { translateX: blob1X },
                { translateY: blob1Y },
                { scale: blob1Scale },
              ],
            },
          ]}
        />

        {/* Blob 2 - Olive/Military green */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob2,
            {
              transform: [
                { translateX: blob2X },
                { translateY: blob2Y },
                { scale: blob2Scale },
              ],
            },
          ]}
        />

        {/* Blob 3 - Dark military */}
        <Animated.View
          style={[
            styles.blob,
            styles.blob3,
            {
              transform: [
                { translateX: blob3X },
                { translateY: blob3Y },
                { scale: blob3Scale },
              ],
            },
          ]}
        />

        {/* Blur overlay effect */}
        <View style={styles.blurOverlay} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../assets/GEARTEDicon9.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
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
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blob1: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#4B5D3A',
    opacity: 0.4,
    top: '20%',
    left: '10%',
  },
  blob2: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#6B7C5A',
    opacity: 0.35,
    top: '50%',
    right: '5%',
  },
  blob3: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: '#8B9A7A',
    opacity: 0.3,
    bottom: '15%',
    left: '15%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 250,
    maxHeight: 250,
  },
});
