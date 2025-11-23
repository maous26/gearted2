import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import ErrorBoundary from "../components/ErrorBoundary";
import { QueryProvider } from "../components/QueryProvider";
import SplashScreen from "../components/SplashScreen";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { UserProvider } from "../components/UserProvider";
import { useProductsStore } from "../stores/productsStore";
import stripeService from "../services/stripe";
import { THEMES } from "../themes";

function RootInner() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [showSplash, setShowSplash] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>('');
  const loadFromStorage = useProductsStore((state) => state.loadFromStorage);

  // Load products from storage on app start
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Load Stripe publishable key
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        const key = await stripeService.getPublishableKey();
        setStripePublishableKey(key);
      } catch (error) {
        console.error('Failed to load Stripe key:', error);
      }
    };
    loadStripeKey();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setSplashFinished(true);
  };

  // Temporarily disable custom fonts due to loading issues
  // const [fontsLoaded, fontError] = useFonts({
  //   'Oswald-Bold': require('../assets/fonts/Oswald-Bold.ttf'),
  // });

  // // Don't block app loading if fonts fail
  // React.useEffect(() => {
  //   if (fontError) {
  //     console.error('Font loading error:', fontError);
  //   }
  // }, [fontError]);

  return (
    <View style={{ backgroundColor: t.rootBg, flex: 1 }}>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {splashFinished && stripePublishableKey ? (
        <StripeProvider publishableKey={stripePublishableKey}>
          <Stack screenOptions={{ headerShown: false }} />
        </StripeProvider>
      ) : splashFinished ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <UserProvider>
            <RootInner />
          </UserProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
