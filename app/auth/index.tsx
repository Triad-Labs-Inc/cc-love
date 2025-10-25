import { Text, View, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/theme-toggle';

// Warm up the browser for better OAuth performance
export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  useWarmUpBrowser();

  const router = useRouter();
  const { theme } = useTheme();
  const { isSignedIn } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [loading, setLoading] = useState(false);

  // Redirect to home if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(home)/(tabs)');
    }
  }, [isSignedIn]);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        // Auth state will update and the useEffect above will handle navigation
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));

      // Handle "session already exists" error gracefully
      // The user is already signed in, so just let the useEffect redirect them
      if (err?.errors?.[0]?.code === 'session_exists') {
        setLoading(false);
        return;
      }

      setLoading(false);
      Alert.alert(
        'Authentication Error',
        err.errors?.[0]?.message || 'Failed to sign in with Google. Please try again.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Theme Toggle in top right */}
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.muted }]}>
            <Text style={styles.logoText}>📱</Text>
          </View>
          <Text style={[styles.title, { color: theme.foreground }]}>cc.love</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Sign in to continue
          </Text>
        </View>

        {/* Google Sign In Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="outline"
            onPress={handleGoogleSignIn}
            disabled={loading}
            loading={loading}
            style={styles.googleButton}>
            <View style={styles.googleButtonContent}>
              <Image
                source={{ uri: 'https://img.clerk.com/static/google.png?width=160' }}
                style={styles.googleIcon}
              />
              <Text style={[styles.googleButtonText, { color: theme.foreground }]}>
                Continue with Google
              </Text>
            </View>
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.mutedForeground }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 50,
    right: 12,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  googleButton: {
    height: 56,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
