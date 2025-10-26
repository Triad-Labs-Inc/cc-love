import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from './ui/bottom-sheet';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeName, getTheme, themeMetadata } from '@/lib/theme';

type ThemeSelectorSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ThemeSelectorSheet({ isOpen, onClose }: ThemeSelectorSheetProps) {
  const { themeName, theme, setTheme } = useTheme();

  const handleSelectTheme = (selectedTheme: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(selectedTheme);
    // Close the sheet after a brief delay to show the selection
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const themeOptions: ThemeName[] = ['green', 'red', 'blue'];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoint={0.45}
      backgroundColor={theme.card}
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Choose AI Personality
        </Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Select the theme that matches your mood
        </Text>

        <View style={styles.themesContainer}>
          {themeOptions.map((option) => {
            const optionTheme = getTheme(option);
            const metadata = themeMetadata[option];
            const isSelected = themeName === option;

            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    backgroundColor: isSelected
                      ? theme.secondary
                      : theme.background,
                    borderColor: isSelected ? theme.primary : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  pressed && styles.themeOptionPressed,
                ]}
                onPress={() => handleSelectTheme(option)}
              >
                {/* Color Swatches */}
                <View style={styles.swatchContainer}>
                  <View
                    style={[
                      styles.swatchLarge,
                      { backgroundColor: optionTheme.primary },
                    ]}
                  />
                  <View style={styles.swatchRow}>
                    <View
                      style={[
                        styles.swatchSmall,
                        { backgroundColor: optionTheme.accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.swatchSmall,
                        { backgroundColor: optionTheme.background },
                      ]}
                    />
                  </View>
                </View>

                {/* Theme Info */}
                <View style={styles.themeInfo}>
                  <View style={styles.labelRow}>
                    <Text style={styles.icon}>{metadata.icon}</Text>
                    <Text
                      style={[
                        styles.themeLabel,
                        { color: theme.foreground },
                        isSelected && styles.themeLabelBold,
                      ]}
                    >
                      {metadata.label}
                    </Text>
                  </View>
                  <Text
                    style={[styles.themeDescription, { color: theme.mutedForeground }]}
                  >
                    {metadata.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  themesContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  themeOptionPressed: {
    opacity: 0.7,
  },
  swatchContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  swatchLarge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swatchRow: {
    gap: 6,
  },
  swatchSmall: {
    width: 20,
    height: 20,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeInfo: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeLabelBold: {
    fontWeight: '700',
  },
  themeDescription: {
    fontSize: 14,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
