import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { THEMES, ThemeKey } from "../themes";

type TextVariant = "none" | "subtitle" | "full";

type BrandLogoProps = {
  theme: ThemeKey;
  size?: "small" | "medium" | "large";
  /**
   * Deprecated: use textVariant instead.
   * If provided, true => full, false => none. Ignored when textVariant is set.
   */
  showText?: boolean;
  /**
   * Controls text rendering beside the logo
   * - none: icon only
   * - subtitle: renders only "Airsoft Marketplace"
   * - full: renders GEARTED + subtitle
   */
  textVariant?: TextVariant;
};

export function BrandLogo({
  theme,
  size = "medium",
  showText,
  textVariant,
}: BrandLogoProps) {
  const t = THEMES[theme];

  const sizeConfig = {
    small: { logoSize: 32, fontSize: 14, spacing: 8 },
    medium: { logoSize: 40, fontSize: 18, spacing: 10 },
    large: { logoSize: 56, fontSize: 24, spacing: 12 },
  } as const;

  const config = sizeConfig[size];

  // Back-compat: map showText to textVariant when textVariant not explicitly provided
  const resolvedVariant: TextVariant = textVariant
    ? textVariant
    : showText === undefined
    ? "full"
    : showText
    ? "full"
    : "none";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: (config as any).spacing,
      }}
    >
      <Image
        source={require("../assets/geartedicon.png")}
        style={{
          width: (config as any).logoSize,
          height: (config as any).logoSize,
        }}
        contentFit="contain"
      />
      {resolvedVariant !== "none" && (
        <View>
          {resolvedVariant === "full" && (
            <Text
              style={{
                color: t.heading,
                fontSize: (config as any).fontSize,
                fontWeight: "bold",
                fontFamily: "System",
                letterSpacing: -0.5,
              }}
            >
              GEARTED
            </Text>
          )}
          <Text
            style={{
              color: t.muted,
              fontSize: (config as any).fontSize * 0.6,
              fontWeight: "500",
              fontFamily: "System",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Airsoft Marketplace
          </Text>
        </View>
      )}
    </View>
  );
}
