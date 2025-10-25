import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/theme-toggle';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.muted }]}>
              <Text style={[styles.avatarText, { color: theme.mutedForeground }]}>
                {getUserInitials()}
              </Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <Text style={[styles.userName, { color: theme.foreground }]}>
          {user?.fullName || user?.firstName || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.mutedForeground }]}>
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
        {user?.primaryPhoneNumber?.phoneNumber && (
          <Text style={[styles.userPhone, { color: theme.mutedForeground }]}>
            {user.primaryPhoneNumber.phoneNumber}
          </Text>
        )}
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Appearance</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>Theme</Text>
            <ThemeToggle />
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Account</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>Account ID</Text>
            <Text style={[styles.infoValue, { color: theme.foreground }]} numberOfLines={1}>
              {user?.id?.substring(0, 16)}...
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>Member Since</Text>
            <Text style={[styles.infoValue, { color: theme.foreground }]}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={styles.section}>
        <Button
          variant="destructive"
          onPress={handleLogout}
          style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Button>
      </View>

      {/* App Version */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.versionText, { color: theme.mutedForeground }]}>
          cc.love v1.0.0
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 12,
  },
});
