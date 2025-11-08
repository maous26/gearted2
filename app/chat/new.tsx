import { router } from "expo-router";
import React from "react";
import {
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../components/ThemeProvider";
import { THEMES } from "../../themes";

export default function NewChatScreen() {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.rootBg }}>
      <StatusBar barStyle={theme === 'night' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{
        backgroundColor: t.navBg + 'CC',
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: t.primaryBtn }}>←</Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: t.heading,
          flex: 1,
          textAlign: 'center'
        }}>
          Nouveau message
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32
      }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
        <Text style={{
          fontSize: 18,
          color: t.heading,
          textAlign: 'center',
          marginBottom: 8
        }}>
          Contactez le vendeur
        </Text>
        <Text style={{
          fontSize: 14,
          color: t.muted,
          textAlign: 'center'
        }}>
          La conversation sera créée avec le vendeur de cet article
        </Text>
      </View>
    </SafeAreaView>
  );
}
