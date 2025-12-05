import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "./ThemeProvider";
import { THEMES } from "../themes";

interface LegalFooterProps {
  style?: object;
}

export default function LegalFooter({ style }: LegalFooterProps) {
  const { theme } = useTheme();
  const t = THEMES[theme];

  return (
    <View style={[{
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.rootBg,
    }, style]}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <TouchableOpacity onPress={() => router.push('/legal/cgu' as any)}>
          <Text style={{ fontSize: 12, color: t.muted, textDecorationLine: 'underline' }}>
            CGU
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: t.muted }}>•</Text>

        <TouchableOpacity onPress={() => router.push('/legal/cgv' as any)}>
          <Text style={{ fontSize: 12, color: t.muted, textDecorationLine: 'underline' }}>
            CGV
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: t.muted }}>•</Text>

        <TouchableOpacity onPress={() => router.push('/legal/privacy' as any)}>
          <Text style={{ fontSize: 12, color: t.muted, textDecorationLine: 'underline' }}>
            Confidentialite
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{
        fontSize: 11,
        color: t.muted,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7
      }}>
        GEARTED SAS - Tous droits reserves
      </Text>
    </View>
  );
}
