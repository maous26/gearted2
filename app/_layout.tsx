import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import ErrorBoundary from "../components/ErrorBoundary";
import { QueryProvider } from "../components/QueryProvider";
import SplashScreen from "../components/SplashScreen";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { UserProvider } from "../components/UserProvider";
import { useProductsStore } from "../stores/productsStore";
import { THEMES } from "../themes";

function RootInner() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [showSplash, setShowSplash] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);
  const loadFromStorage = useProductsStore((state) => state.loadFromStorage);

  // Load products from storage on app start
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

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
      {splashFinished && <Stack screenOptions={{ headerShown: false }} />}
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
