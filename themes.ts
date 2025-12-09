export type ThemeKey = "ranger" | "desert" | "night";

export const THEMES: Record<
  ThemeKey,
  {
    rootBg: string;
    navBg: string;
    sectionLight: string;
    heroGradStart: string;
    heroGradEnd: string;
    primaryBtn: string;
    border: string;
    cardBg: string;
    pillBg: string;
    heading: string;
    muted: string;
    subtle: string;
    extraMuted: string;
    white: string;
    gradientColors: readonly [string, string, ...string[]];
    text: string;
    mutedText: string;
    accentBg: string;
    accentBtn: string;
    secondaryBtn: string;
  }
> = {
  ranger: {
    rootBg: "#f7f8f3",
    navBg: "#F1E6CB",
    sectionLight: "#F1E6CB",
    heroGradStart: "#F5F0E1",
    heroGradEnd: "#E9E1C8",
    primaryBtn: "#4B5D3A",
    border: "#D8CEB1",
    cardBg: "#EDE6C9",
    pillBg: "#EFE6C8",
    heading: "#1a1a1a",
    muted: "#666666",
    subtle: "#4a4a4a",
    extraMuted: "#808080",
    white: "#ffffff",
    gradientColors: ["#4B5D3A", "#6B7A57"],
    text: "#1a1a1a",
    mutedText: "#666666",
    accentBg: "#E9E1C8",
    accentBtn: "#6B7A57",
    secondaryBtn: "#D8CEB1",
  },
  desert: {
    rootBg: "#f6f3f0",
    navBg: "#EFE2C1",
    sectionLight: "#F3E7CB",
    heroGradStart: "#F6EDD6",
    heroGradEnd: "#EDDFBF",
    primaryBtn: "#7B5E3B",
    border: "#E0D3B2",
    cardBg: "#F1E4C3",
    pillBg: "#F6EDD6",
    heading: "#2B2B2B",
    muted: "#4A4A4A",
    subtle: "#3A3A3A",
    extraMuted: "#6B6B6B",
    white: "#ffffff",
    gradientColors: ["#7B5E3B", "#A17F5B"],
    text: "#2B2B2B",
    mutedText: "#4A4A4A",
    accentBg: "#EDDFBF",
    accentBtn: "#A17F5B",
    secondaryBtn: "#E0D3B2",
  },
  night: {
    rootBg: "#0f141a",
    navBg: "#0F1310",
    sectionLight: "#111711",
    heroGradStart: "#151B16",
    heroGradEnd: "#0F1310",
    primaryBtn: "#1F3D2B",
    border: "#253227",
    cardBg: "#111711",
    pillBg: "#1A231C",
    heading: "#EAF2E8",
    muted: "#D0DBC9",
    subtle: "#C5D1C0",
    extraMuted: "#A3B2A0",
    white: "#ffffff",
    gradientColors: ["#1F3D2B", "#2F5A3F"],
    text: "#EAF2E8",
    mutedText: "#A3B2A0",
    accentBg: "#1A231C",
    accentBtn: "#2F5A3F",
    secondaryBtn: "#253227",
  },
};
