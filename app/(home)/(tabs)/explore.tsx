import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { fetchNotifications, NotificationRecord } from '@/utils/api';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setError(null);
      console.log('[Love Coach] Fetching notifications...');
      const data = await fetchNotifications();
      console.log('[Love Coach] Received notifications:', data);
      console.log('[Love Coach] Notification count:', data.length);
      setNotifications(data);
    } catch (err) {
      console.error('[Love Coach] Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'endless-small-talk':
        return '#F59E0B'; // Amber
      case 'passive-planning':
        return '#8B5CF6'; // Purple
      case 'friendzone-alert':
        return '#EF4444'; // Red
      case 'dumb-message':
        return '#F97316'; // Orange
      case 'general-advice':
        return '#10B981'; // Green
      default:
        return theme.mutedForeground;
    }
  };

  const getNotificationIcon = (type: string): any => {
    switch (type) {
      case 'endless-small-talk':
        return 'bubble.left.and.bubble.right';
      case 'passive-planning':
        return 'calendar';
      case 'friendzone-alert':
        return 'heart.slash';
      case 'dumb-message':
        return 'exclamationmark.triangle';
      case 'general-advice':
        return 'lightbulb';
      default:
        return 'bell';
    }
  };

  const renderNotification = ({ item }: { item: NotificationRecord }) => {
    const color = getNotificationColor(item.type);
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.7}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <IconSymbol name={icon} size={20} color={color} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.notificationTitle, { color: theme.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.timestamp, { color: theme.mutedForeground }]}>
              {formatTimestamp(item.sentAt)}
            </Text>
          </View>
        </View>
        <Text style={[styles.notificationBody, { color: theme.cardForeground }]} numberOfLines={3}>
          {item.body}
        </Text>
        {item.triggerReason && (
          <View style={[styles.reasonBadge, { backgroundColor: theme.muted }]}>
            <Text style={[styles.reasonText, { color: theme.mutedForeground }]} numberOfLines={1}>
              {item.triggerReason}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="bell.slash" size={64} color={theme.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No Notifications Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.mutedForeground }]}>
        Your relationship coaching notifications will appear here
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="exclamationmark.triangle" size={64} color={theme.destructive} />
      <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Oops!</Text>
      <Text style={[styles.emptySubtitle, { color: theme.mutedForeground }]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={loadNotifications}>
        <Text style={[styles.retryButtonText, { color: theme.primaryForeground }]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Love Coach</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Love Coach</Text>
        <Text style={[styles.headerSubtitle, { color: theme.mutedForeground }]}>
          {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
        </Text>
      </View>
      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => `${item.conversationId}-${item.sentAt}-${index}`}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
