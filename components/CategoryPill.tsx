import React from "react";
import { Pressable, Text } from "react-native";
import { THEMES, ThemeKey } from "../themes";

export function CategoryPill({
  label,
  icon,
  theme,
  onPress,
}: {
  label: string;
  icon: string;
  theme: ThemeKey;
  onPress?: () => void;
}) {
  const t = THEMES[theme];
  
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: t.pillBg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: t.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text style={{ marginRight: 8, fontSize: 16 }}>{icon}</Text>
      <Text style={{ 
        color: t.heading, 
        fontWeight: '500',
        fontSize: 14 
      }}>
        {label}
      </Text>
    </Pressable>
  );
}