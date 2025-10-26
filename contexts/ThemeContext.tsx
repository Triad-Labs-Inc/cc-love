import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getTheme, Theme, ThemeName } from '@/lib/theme';

type ThemeContextType = {
  themeName: ThemeName;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';
const DEFAULT_THEME: ThemeName = 'green';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME);
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);

      // Validate saved theme and handle backwards compatibility
      if (savedTheme === 'green' || savedTheme === 'red' || savedTheme === 'blue') {
        setThemeNameState(savedTheme);
      } else if (savedTheme === 'light' || savedTheme === 'dark') {
        // Backwards compatibility: migrate old light/dark themes to new system
        // light -> green (friendly), dark -> red (aggressive)
        const migratedTheme = savedTheme === 'light' ? 'green' : 'red';
        setThemeNameState(migratedTheme);
        // Save the migrated theme
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, migratedTheme);
      } else {
        // Use default theme if nothing saved or invalid value
        setThemeNameState(DEFAULT_THEME);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setThemeNameState(DEFAULT_THEME);
    } finally {
      setIsReady(true);
    }
  };

  const setTheme = async (name: ThemeName) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, name);
      setThemeNameState(name);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = getTheme(themeName);

  // Don't render children until theme is loaded
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeName, theme, setTheme }}>
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
