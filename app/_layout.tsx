import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import ErrorBoundary from "../components/ErrorBoundary";
import { QueryProvider } from "../components/QueryProvider";
import { SocketProvider } from "../components/SocketProvider";
import SplashScreen from "../components/SplashScreen";
import { ConditionalStripeProvider } from "../components/StripeWrapper";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { UserProvider } from "../components/UserProvider";
import { useProductsStore } from "../stores/productsStore";
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
    // Hardcoded for dev to avoid async loading issues
    setStripePublishableKey('pk_test_51SVrSp5kpmvcwVKoKtTa2fpnh7C672dg2IA7WESQ8swOwRMHCa7a5gYfWo4HgvJoICIKA7CEphR3iSJHQsw6VYyE00Z6fjdwR7');
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
        <ConditionalStripeProvider publishableKey={stripePublishableKey}>
          <Stack screenOptions={{ headerShown: false }} />
        </ConditionalStripeProvider>
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
            <SocketProvider>
              <RootInner />
            </SocketProvider>
          </UserProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
