/**
 * Theme configuration for light and dark modes
 */

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

export const lightTheme: Theme = {
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  card: '#FFFFFF',
  cardForeground: '#0A0A0A',
  primary: '#000000',
  primaryForeground: '#FAFAFA',
  secondary: '#F5F5F5',
  secondaryForeground: '#0A0A0A',
  muted: '#F5F5F5',
  mutedForeground: '#737373',
  accent: '#F5F5F5',
  accentForeground: '#0A0A0A',
  destructive: '#DC2626',
  destructiveForeground: '#FAFAFA',
  border: '#E5E5E5',
  input: '#E5E5E5',
  ring: '#0A0A0A',
};

export const darkTheme: Theme = {
  background: '#0A0A0A',
  foreground: '#FAFAFA',
  card: '#0A0A0A',
  cardForeground: '#FAFAFA',
  primary: '#FAFAFA',
  primaryForeground: '#0A0A0A',
  secondary: '#262626',
  secondaryForeground: '#FAFAFA',
  muted: '#262626',
  mutedForeground: '#A3A3A3',
  accent: '#262626',
  accentForeground: '#FAFAFA',
  destructive: '#EF4444',
  destructiveForeground: '#FAFAFA',
  border: '#262626',
  input: '#262626',
  ring: '#D4D4D4',
};
