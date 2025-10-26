import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { themeMetadata } from '@/lib/theme';
import { ThemeSelectorSheet } from './theme-selector-sheet';

export function ThemeSelector() {
  const { themeName, theme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const metadata = themeMetadata[themeName];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSheetOpen(true);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          },
          pressed && styles.containerPressed,
        ]}
        onPress={handlePress}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{metadata.icon}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: theme.mutedForeground }]}>
              AI Personality
            </Text>
            <Text style={[styles.value, { color: theme.foreground }]}>
              {metadata.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: theme.mutedForeground }]}>›</Text>
      </Pressable>

      <ThemeSelectorSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  containerPressed: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 32,
    fontWeight: '300',
  },
});
