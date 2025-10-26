/**
 * Theme configuration for AI personality modes
 * - Green: Friendly, warm, approachable AI
 * - Red: Aggressive, bold, energetic AI
 * - Blue: Relaxed, calm, mellow AI
 */

export type ThemeName = 'green' | 'red' | 'blue';

export type Theme = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

/**
 * Green Theme - Friendly AI
 * Warm, nature-inspired palette with excellent readability
 */
export const greenTheme: Theme = {
  background: '#F0F7F4',      // Soft sage background
  foreground: '#0F3A2E',       // Deep forest green text
  card: '#FFFFFF',             // White cards for clarity
  cardForeground: '#0F3A2E',   // Deep forest green on cards
  primary: '#059669',          // Vibrant emerald green
  primaryForeground: '#FFFFFF', // White on primary buttons
  secondary: '#D1FAE5',        // Light mint green
  secondaryForeground: '#065F46', // Dark green on secondary
  muted: '#E7F3EF',            // Very light sage
  mutedForeground: '#4B7563',  // Muted green-gray
  accent: '#10B981',           // Bright green accent
  accentForeground: '#FFFFFF', // White on accent
  destructive: '#DC2626',      // Red for destructive actions
  destructiveForeground: '#FFFFFF', // White on destructive
  border: '#A7F3D0',           // Light green border
  input: '#FFFFFF',            // White input backgrounds
  ring: '#059669',             // Emerald focus ring
};

/**
 * Red Theme - Aggressive AI
 * Bold, high-contrast dark palette with energetic accents
 */
export const redTheme: Theme = {
  background: '#1A1A1A',       // Dark charcoal background
  foreground: '#FAFAFA',       // Near-white text
  card: '#262626',             // Slightly lighter dark cards
  cardForeground: '#FAFAFA',   // Near-white on cards
  primary: '#EF4444',          // Vibrant red
  primaryForeground: '#FFFFFF', // White on primary buttons
  secondary: '#3F3F3F',        // Medium gray
  secondaryForeground: '#FAFAFA', // Near-white on secondary
  muted: '#2A2A2A',            // Slightly lighter than background
  mutedForeground: '#A3A3A3',  // Medium gray text
  accent: '#F87171',           // Lighter red accent
  accentForeground: '#1A1A1A', // Dark text on accent
  destructive: '#DC2626',      // Darker red for destructive
  destructiveForeground: '#FFFFFF', // White on destructive
  border: '#3F3F3F',           // Medium gray border
  input: '#262626',            // Dark input backgrounds
  ring: '#EF4444',             // Red focus ring
};

/**
 * Blue Theme - Relaxed AI
 * Calm, professional palette with soothing blues
 */
export const blueTheme: Theme = {
  background: '#F1F5F9',       // Soft gray-blue background
  foreground: '#0F172A',       // Deep navy text
  card: '#FFFFFF',             // White cards
  cardForeground: '#0F172A',   // Deep navy on cards
  primary: '#3B82F6',          // Bright blue
  primaryForeground: '#FFFFFF', // White on primary buttons
  secondary: '#E0E7FF',        // Light indigo
  secondaryForeground: '#1E40AF', // Deep blue on secondary
  muted: '#E2E8F0',            // Light slate
  mutedForeground: '#64748B',  // Slate gray text
  accent: '#60A5FA',           // Sky blue accent
  accentForeground: '#FFFFFF', // White on accent
  destructive: '#DC2626',      // Red for destructive actions
  destructiveForeground: '#FFFFFF', // White on destructive
  border: '#CBD5E1',           // Light blue-gray border
  input: '#FFFFFF',            // White input backgrounds
  ring: '#3B82F6',             // Blue focus ring
};

/**
 * Theme metadata for UI display
 */
export const themeMetadata: Record<ThemeName, { label: string; description: string; icon: string }> = {
  green: {
    label: 'Friendly',
    description: 'Warm and approachable',
    icon: '🌿',
  },
  red: {
    label: 'Aggressive',
    description: 'Bold and energetic',
    icon: '🔥',
  },
  blue: {
    label: 'Relaxed',
    description: 'Calm and mellow',
    icon: '💙',
  },
};

/**
 * Get theme object by name
 */
export function getTheme(themeName: ThemeName): Theme {
  switch (themeName) {
    case 'green':
      return greenTheme;
    case 'red':
      return redTheme;
    case 'blue':
      return blueTheme;
    default:
      return greenTheme; // Default fallback
  }
}
