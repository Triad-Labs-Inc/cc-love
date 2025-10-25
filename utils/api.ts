import { getDeviceId } from './device';

/**
 * API client for cc.love backend
 */

// Use environment variable or fallback to local development
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface NotificationRecord {
  type: string;
  title: string;
  body: string;
  sentAt: number;
  triggerReason: string;
  conversationId: string;
  deviceId?: string; // Optional for now, included when fetching all
}

export interface NotificationsResponse {
  notifications: NotificationRecord[];
  count: number;
}

/**
 * Fetches all notifications (for debugging, fetches ALL notifications across all devices)
 */
export async function fetchNotifications(): Promise<NotificationRecord[]> {
  try {
    const deviceId = await getDeviceId();
    // TEMPORARY: Fetch ALL notifications for debugging
    const url = `${API_BASE_URL}/api/notifications?deviceId=${encodeURIComponent(deviceId)}&all=true`;

    console.log('[API] Fetching ALL notifications from:', url);
    console.log('[API] Device ID:', deviceId);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NotificationsResponse = await response.json();
    console.log('[API] Response data:', JSON.stringify(data, null, 2));
    console.log('[API] Total notifications received:', data.count);

    // Log unique deviceIds found in notifications
    if (data.notifications.length > 0) {
      const uniqueDeviceIds = [...new Set(data.notifications.map(n => (n as any).deviceId))];
      console.log('[API] Unique deviceIds in notifications:', uniqueDeviceIds);
    }

    return data.notifications;
  } catch (error) {
    console.error('[API] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Sends a frame/screenshot to the backend for analysis
 * (This will be used later when implementing screen recording upload)
 */
export async function sendFrame(
  conversationId: string,
  frameNumber: number,
  imageBase64: string
): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    const url = `${API_BASE_URL}/api/message`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId,
        conversationId,
        frameNumber,
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending frame:', error);
    throw error;
  }
}
