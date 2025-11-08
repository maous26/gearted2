import { Stack } from "expo-router";
import { View } from "react-native";
import ErrorBoundary from "../components/ErrorBoundary";
import { QueryProvider } from "../components/QueryProvider";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import { UserProvider } from "../components/UserProvider";
import { THEMES } from "../themes";

function RootInner() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <View style={{ backgroundColor: t.rootBg, flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
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
