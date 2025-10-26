import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = theme.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
