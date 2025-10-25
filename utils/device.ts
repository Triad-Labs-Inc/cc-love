import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'cc_device_id';

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates a persistent device ID
 * This ID is used to identify the device across app launches
 * and to fetch notifications from the backend
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to retrieve existing device ID
    const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (existingId) {
      console.log('[Device] Using existing device ID:', existingId);
      return existingId;
    }

    // Generate a new device ID if none exists
    const newId = generateUUID();
    console.log('[Device] Generated new device ID:', newId);
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);

    return newId;
  } catch (error) {
    console.error('[Device] Error getting/creating device ID:', error);
    // Fallback: generate a temporary ID (won't persist across app restarts)
    const tempId = generateUUID();
    console.warn('[Device] Using temporary device ID:', tempId);
    return tempId;
  }
}

/**
 * Clears the stored device ID (useful for debugging/testing)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
}
