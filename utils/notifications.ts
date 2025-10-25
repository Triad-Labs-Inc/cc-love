import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getDeviceId } from './device';

export interface PushTokenData {
  token: string;
  deviceId: string;
  deviceName: string | null;
  platform: string;
}

/**
 * Registers the device for push notifications and returns the Expo Push Token.
 * This function handles permission requests and token generation.
 *
 * @returns Promise<PushTokenData | null> - The push token data or null if registration fails
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenData | null> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Get project ID from app.json config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('No project ID found in app config. Run: npx eas init');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;

    console.log('Push token:', token);

    // Get the consistent device ID
    const deviceId = await getDeviceId();
    console.log('Using device ID:', deviceId);

    return {
      token,
      deviceId, // Use consistent device ID from device.ts
      deviceName: Device.deviceName,
      platform: Platform.OS,
    };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Sends the push token to your backend server for storage.
 *
 * @param tokenData - The push token data to send
 * @param apiEndpoint - Your backend API endpoint (default: https://cc-love.vercel.app/api/push-tokens)
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function sendPushTokenToBackend(
  tokenData: PushTokenData,
  apiEndpoint: string = 'https://cc-love.vercel.app/api/push-tokens'
): Promise<boolean> {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Token sent to backend successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending token to backend:', error);
    return false;
  }
}

/**
 * Configures how notifications should be handled when the app is in the foreground.
 * By default, notifications will be shown with sound and badge updates.
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
