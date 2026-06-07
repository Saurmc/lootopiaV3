// Design tokens extracted from Figma mockups (specs/maquettes/)

const colors = {
  // Primary — coral/salmon: CTAs, active tab, accents (login button, play buttons, profile tab)
  // Gradient Figma exact: color/red/72 → color/red/80
  primary: '#FB8875',             // color/red/72 — stop dominant (Figma)
  primaryLight: '#FFA99A',        // color/red/80 — stop clair (Figma)
  primaryDark: '#D4614A',         // estimation

  // Dark purple gradient — login, hunt detail, completion, profile header, hunts list header
  gradientStart: '#5C50A6',    // purple-blue, gradient top
  gradientEnd: '#3D2F88',      // deep indigo, gradient bottom

  // Backgrounds
  background: '#3D2F88',       // dark purple base (dark screens)
  surface: '#FFFFFF',          // cards, hunt rows, light-screen body
  surfaceElevated: '#F8F5FF',  // very subtly tinted white // estimation

  // Inputs on dark backgrounds (semi-transparent frosted)
  inputBackground: 'rgba(255,255,255,0.15)', // estimation
  inputBorder: 'rgba(255,255,255,0.28)',      // estimation

  // Hunt card icon background (purple square thumbnail)
  huntIconBackground: '#5C50A6', // estimation — matches gradient top

  // Text
  text: '#1E1B3A',             // near-black (card titles, body on light screens)
  textSecondary: '#8B8AAD',    // gray-purple (location labels, meta info) // estimation
  textDisabled: '#BDBDCE',     // estimation
  textInverse: '#FFFFFF',      // white on dark backgrounds

  // Borders
  border: '#E2DFEE',           // light card border // estimation
  borderLight: '#F0EDF8',      // very light separator // estimation

  // Status — success (✓ 100% badge, checkmarks on profile cards)
  success: '#4CAF50',
  successLight: '#E8F5E9',     // estimation

  // Status — error
  error: '#EF5350',            // estimation
  errorLight: '#FFEBEE',       // estimation

  // Status — warning
  warning: '#FF9800',          // estimation
  warningLight: '#FFF3E0',     // estimation

  // Difficulty badges (not explicitly visible, deduced from typical hunt-app patterns)
  difficultyEasy: '#4CAF50',   // estimation
  difficultyMedium: '#FF9800', // estimation
  difficultyHard: '#EF5350',   // estimation

  // Progress bar (step bar on hunt detail screen)
  progressFill: '#F07860',     // coral — estimation (gradient toward primary)
  progressBackground: 'rgba(255,255,255,0.20)', // estimation

  // Points / XP (gold star icon on hunt cards and completion screen)
  points: '#FFC107',           // amber/gold // estimation

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarActive: '#F07860',     // coral — confirmed on Profil tab (login) and Carte tab (hunts list)
  tabBarInactive: '#9B9BB8',   // estimation

  // Header (hunts list header, purple solid)
  header: '#4A3898',           // estimation — midpoint of gradient
  headerText: '#FFFFFF',
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const borderRadius = {
  sm: 8,    // small chips, grid cells (hunt detail puzzle)
  md: 12,   // inputs, play buttons, hunt thumbnails
  lg: 16,   // cards (hunt rows, stat cards on profile)
  xl: 24,   // main CTA buttons ("Se connecter", "Sauvegarder")
  full: 9999, // avatar, pill badges ("100% Complète", "Badge Expert"), tab indicator
} as const;

const typography = {
  // "Félicitations !" on completion screen
  h1: { fontSize: 32, fontWeight: '700' as const },
  // "Chasses disponibles", "Aventurier Pro", section titles
  h2: { fontSize: 24, fontWeight: '700' as const },
  // "La Fontaine Mystérieuse", hunt card title
  h3: { fontSize: 20, fontWeight: '600' as const },
  // Body text, instructions
  body: { fontSize: 16, fontWeight: '400' as const },
  // Hunt meta (distance, time, points), secondary lines
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  // Button labels, stat numbers
  label: { fontSize: 14, fontWeight: '600' as const },
  // "Pas encore inscrit ?", timestamps, tiny badges
  caption: { fontSize: 12, fontWeight: '400' as const },
  // "Lootopia" logo — cursive/script font (likely custom brand font; name unconfirmed)
  logoFont: { fontSize: 40, fontWeight: '400' as const, fontFamily: 'Lootopia-Script' }, // estimation
} as const;

// Visible on hunt cards and the completion stats card
const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

const navigation = {
  tabBarHeight: 64,              // estimation
  tabBarBackground: '#FFFFFF',
  headerBackground: '#4A3898',   // purple (hunts list header) // estimation
  headerHeight: 56,              // estimation
  indicatorColor: '#F07860',     // coral pill indicator behind active tab
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  navigation,
} as const;

export type Theme = typeof theme;
export default theme;
