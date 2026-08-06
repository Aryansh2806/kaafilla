export const colors = {
  // Backgrounds
  bg: '#161826', // page canvas — deepest dark
  surface: '#232532', // cards, inputs
  surfaceRaised: '#1b1d2b', // elevated panels, sidebar items
  border: 'rgba(233,233,237,0.16)', // divider

  // Text
  text: '#e9e9ed', // primary
  textSub: '#9397ab', // secondary
  textMuted: '#75798c', // captions
  textFaint: '#595d6c', // labels, section headers

  // Accent purple ramp (blurple — OKLCH hue 289.2)
  accent: '#9184d9', // main interactive
  accent2: '#a7a1db', // secondary accent
  accentL1: '#f5f4ff',
  accentL2: '#e7e5fe',
  accentL3: '#d2cefd',
  accentL4: '#b5abfc',
  accentL5: '#968ae0',
  accentD1: '#796cbf',
  accentD2: '#5d5294',
  accentD3: '#423a6a',
  accentD4: '#2b2741',

  // Neutral ramp
  n100: '#f3f5fe',
  n200: '#e4e7f5',
  n300: '#cfd3e5',
  n400: '#b2b6ca',
  n500: '#9397ab',
  n600: '#75798c',
  n700: '#595d6c',
  n800: '#3f424d',
  n900: '#292b31',

  // Section / splash gradients
  sectionBg: '#262a60',
  sectionGlow: '#353b80',
  sectionGhost: '#4c5397',

  // Semantic
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  // Font families
  fontSans: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontBold: 'Inter_600SemiBold',
  fontDev: 'NotoSansDevanagari_400Regular', // for Hindi text

  // Scale (px). Half-steps (kicker/meta/body2) are the prototype's hand-tuned values.
  size: {
    '2xs': 10,
    kicker: 10.5, // uppercase section kickers
    xs: 11,
    meta: 11.5,
    sm: 12,
    body2: 12.5, // dominant small text in the prototype
    base: 13,
    md: 14,
    lg: 15, // body default
    xl: 17,
    '2xl': 20,
    '3xl': 25,
    '4xl': 32,
    '5xl': 40,
  },

  // Line heights (multipliers)
  lineHeight: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.55,
  },

  // Letter spacing (px)
  letterSpacing: {
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 1.5,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#3f424d',
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#595d6c',
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 40,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#9397ab',
  },
} as const;

// Component role tokens — map raw ramp colors to UI roles (from the prototype).
export const roles = {
  buttonPrimaryBg: colors.accentL3, // #d2cefd
  buttonPrimaryText: colors.accentD4, // #2b2741
  buttonDisabledBg: 'rgba(245,244,255,0.14)',
  buttonDisabledText: colors.accentL1, // #f5f4ff
  selectedRing: colors.accent, // #9184d9
  tabActive: colors.accentL4, // #b5abfc
  tabInactive: colors.textMuted, // #75798c
  tabBarBg: colors.surfaceRaised, // #1b1d2b
  hairline: 'rgba(233,233,237,0.08)',
} as const;

// Gradients as data (RN needs expo-linear-gradient / svg RadialGradient, not CSS strings).
export const gradients = {
  // Splash + verify hero — radial.
  hero: {
    center: { x: 0.5, y: 0.34 },
    stops: [
      { color: '#353b80', offset: 0 },
      { color: '#262a60', offset: 0.4 },
      { color: '#1b1d2b', offset: 0.78 },
      { color: '#161826', offset: 1 },
    ],
  },
  // Section cards — linear ~160deg.
  section: ['#262a60', '#1f2138'] as [string, string],
  sectionGlow: ['#353b80', '#262a60', '#1d2044'] as [string, string, string],
  // Bottom fade scrim over feed CTAs — to top.
  bottomFade: ['rgba(22,24,38,0)', colors.bg] as [string, string],
} as const;

// Bottom sheet has an exaggerated curved bottom in the prototype.
export const sheetRadius = { topLeft: 22, topRight: 22, bottomLeft: 44, bottomRight: 44 } as const;

export const theme = { colors, spacing, radius, typography, shadows, roles, gradients, sheetRadius } as const;
export type Theme = typeof theme;
