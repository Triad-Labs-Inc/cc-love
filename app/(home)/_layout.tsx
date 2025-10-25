import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme } = useTheme();

  // Show loading spinner while checking authentication status
  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  // Redirect to auth screen if not signed in
  if (!isSignedIn) {
    return <Redirect href="/auth" />;
  }

  // User is authenticated, show the app
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
