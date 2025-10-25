import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { colorScheme, toggleTheme, theme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.secondary, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconContainer}>
        {colorScheme === 'dark' ? (
          // Moon icon (dark mode)
          <View style={styles.moonIcon}>
            <View style={[styles.moonOuter, { backgroundColor: theme.foreground }]} />
            <View style={[styles.moonInner, { backgroundColor: theme.secondary }]} />
          </View>
        ) : (
          // Sun icon (light mode)
          <View style={styles.sunIcon}>
            <View style={[styles.sunCenter, { backgroundColor: theme.foreground }]} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, index) => (
              <View
                key={index}
                style={[
                  styles.sunRay,
                  { backgroundColor: theme.foreground, transform: [{ rotate: `${rotation}deg` }] },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Moon icon styles
  moonIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  moonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  moonInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 2,
    left: 6,
  },
  // Sun icon styles
  sunIcon: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
  },
  sunRay: {
    width: 2,
    height: 6,
    position: 'absolute',
    top: 0,
  },
});
