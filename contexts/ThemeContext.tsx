import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightTheme, darkTheme, Theme } from '@/lib/theme';

type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
  colorScheme: ColorScheme;
  theme: Theme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    deviceColorScheme === 'dark' ? 'dark' : 'light'
  );
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setColorSchemeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
  };

  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Don't render children until theme is loaded
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, theme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
