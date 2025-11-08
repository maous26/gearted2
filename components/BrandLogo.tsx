import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { THEMES, ThemeKey } from "../themes";

export function BrandLogo({ 
  theme, 
  size = "medium",
  showText = true 
}: { 
  theme: ThemeKey; 
  size?: "small" | "medium" | "large";
  showText?: boolean;
}) {
  const t = THEMES[theme];
  
  const sizeConfig = {
    small: { logoSize: 40, fontSize: 14, spacing: 8 },
    medium: { logoSize: 52, fontSize: 18, spacing: 10 },
    large: { logoSize: 72, fontSize: 24, spacing: 12 }
  };
  
  const config = sizeConfig[size];
  
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center',
      gap: config.spacing
    }}>
      <Image 
        source={require('../assets/geartedicon.png')} 
        style={{ 
          width: config.logoSize, 
          height: config.logoSize 
        }}
        contentFit="contain"
      />
      {showText && (
        <View>
          <Text style={{
            color: t.heading,
            fontSize: config.fontSize,
            fontWeight: 'bold',
            fontFamily: 'System',
            letterSpacing: -0.5,
          }}>
            GEARTED
          </Text>
          <Text style={{
            color: t.muted,
            fontSize: config.fontSize * 0.6,
            fontWeight: '500',
            fontFamily: 'System',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}>
            Airsoft Marketplace
          </Text>
        </View>
      )}
    </View>
  );
}
