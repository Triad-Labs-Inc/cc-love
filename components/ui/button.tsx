import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg';

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'default',
  size = 'default',
  children,
  disabled,
  loading,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: theme.destructive,
        };
      default:
        return {
          backgroundColor: theme.primary,
        };
    }
  };

  const buttonStyle = [
    styles.base,
    styles[`size_${size}`],
    getVariantStyles(),
    (disabled || loading) && styles.disabled,
    style,
  ];

  const getLoadingColor = () => {
    if (variant === 'default') return theme.primaryForeground;
    if (variant === 'destructive') return theme.destructiveForeground;
    return theme.foreground;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={getLoadingColor()} />
      ) : (
        <ButtonText variant={variant} size={size}>
          {children}
        </ButtonText>
      )}
    </Pressable>
  );
}

interface ButtonTextProps {
  variant: ButtonVariant;
  size: ButtonSize;
  children: React.ReactNode;
}

function ButtonText({ variant, size, children }: ButtonTextProps) {
  const { theme } = useTheme();

  const getTextColor = (): TextStyle => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return { color: theme.foreground };
      case 'destructive':
        return { color: theme.destructiveForeground };
      default:
        return { color: theme.primaryForeground };
    }
  };

  if (typeof children === 'string') {
    return (
      <Text style={[styles.text, getTextColor(), styles[`text_${size}`]]}>
        {children}
      </Text>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // Sizes
  size_default: {
    height: 44,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  size_lg: {
    height: 52,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // States
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 18,
  },
});
