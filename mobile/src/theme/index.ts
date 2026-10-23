// MiniLedger Design System
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background: '#F7F8FC',
  surface: '#FFFFFF',

  // Brand
  navy: '#243B64',
  navyLight: '#2E4D82',
  accent: '#5B8DEF',
  accentLight: '#EBF1FE',

  // Semantic
  success: '#43A780',
  successLight: '#E6F5EF',
  warning: '#E9A23B',
  warningLight: '#FDF3E3',
  danger: '#E05252',
  dangerLight: '#FDEAEA',

  // Text
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // UI
  border: '#E5E7EB',
  divider: '#F3F4F6',
  cardShadow: 'rgba(36, 59, 100, 0.10)',

  // Legacy aliases
  white: '#FFFFFF',
  muted: '#6B7280',
  line: '#E5E7EB',
  emerald: '#43A780',
  emeraldSoft: '#E6F5EF',
  overdue: '#E05252',
  overdueSoft: '#FDEAEA',
  warningSoft: '#FDF3E3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#243B64',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  small: {
    shadowColor: '#243B64',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const typography = {
  displayLarge: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  display: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  heading: { fontSize: 22, fontWeight: '700' as const },
  subheading: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '700' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1 },
  amount: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  amountLarge: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1 },
};
