import { Platform } from "react-native";

// Tokens replicados 1:1 de site/assets/tokens.css (tema claro).
// Fuente de verdad del diseño: design/canvas/ds/smartriego/tokens.css + site/assets/tokens.css.
export const colors = {
  bg: "#F6F5EF",
  surface: "#FFFFFF",
  surfaceSunken: "#DFDFD4",
  surfaceInverse: "#1B1E1C",
  border: "#D8D7C9",
  borderStrong: "#83846F",
  ink: "#1B1E1C",
  inkMuted: "#5C5F52",
  inkOnInverse: "#F1F0E7",

  primary: "#31410D",
  primaryHover: "#263309",
  onPrimary: "#F7F6EF",
  primarySoft: "#E3E8D5",

  accent: "#4F6A2A",
  onAccent: "#FFFFFF",
  accentSoft: "#E9EFDD",

  suedeGreen: "#6E883F",

  statusOk: "#31410D",
  statusOkSoft: "#E3E8D5",
  statusWarn: "#8F4B00",
  statusWarnSoft: "#FDEBD9",
  statusDanger: "#B3261E",
  statusDangerSoft: "#FBE2DF",
  statusInfo: "#4F6A2A",
  statusInfoSoft: "#E9EFDD",
  statusOffline: "#5B5E51",
  statusOfflineSoft: "#E7E7DF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 999,
} as const;

export const typography = {
  // fontDisplay: 'Geist' no está disponible offline en Expo Go; usamos el stack del sistema.
  fontDisplay: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: "System",
  }),
  fontSans: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }),
  fontMono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

export const shadows = {
  card: {
    shadowColor: "#1B1E1C",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  overlay: {
    shadowColor: "#1B1E1C",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
