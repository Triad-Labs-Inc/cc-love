import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import {
  useGlobalRecording,
  requestMicrophonePermission,
  getMicrophonePermissionStatus,
  // useMicrophonePermission,
  startGlobalRecording,
  stopGlobalRecording,
} from "react-native-nitro-screen-recorder";
import {
  registerForPushNotificationsAsync,
  sendPushTokenToBackend,
  setupNotificationHandler,
} from "../../../utils/notifications";
import { useTheme } from "@/contexts/ThemeContext";
import { getDeviceId } from "@/utils/device";
import * as Notifications from 'expo-notifications';

export default function ScreenRecorderExample() {
  const { theme } = useTheme();
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Register for push notifications when app starts
  useEffect(() => {
    // Configure notification handler to show banners in foreground
    setupNotificationHandler();

    // Load device ID for debugging
    getDeviceId().then(id => {
      setCurrentDeviceId(id);
      console.log('[DEBUG] Current device ID:', id);
    });

    // Listen for incoming notifications to see their data
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[DEBUG] Notification received, full data:', JSON.stringify(notification, null, 2));
      const data = notification.request.content.data;
      console.log('[DEBUG] Notification data object:', data);
      if (data.deviceId) {
        console.log('[DEBUG] DeviceId in notification:', data.deviceId);
      }
      if (data.conversationId) {
        console.log('[DEBUG] ConversationId in notification:', data.conversationId);
      }
    });

    async function setupPushNotifications() {
      try {
        const tokenData = await registerForPushNotificationsAsync();
        if (tokenData) {
          console.log("Successfully registered for push notifications");
          console.log("[DEBUG] Token data:", JSON.stringify(tokenData, null, 2));
          // Send token to backend
          const success = await sendPushTokenToBackend(tokenData);
          if (success) {
            console.log("Token sent to backend successfully");
          } else {
            console.warn("Failed to send token to backend");
          }
        } else {
          console.warn("Failed to register for push notifications");
        }
      } catch (error) {
        console.error("Error setting up push notifications:", error);
      }
    }

    setupPushNotifications();

    return () => {
      notificationListener.remove();
    };
  }, []);

  const { isRecording } = useGlobalRecording({
    onRecordingStarted: () => {
      Alert.alert("Recording started");
    },
    onRecordingFinished: async (file) => {
      if (file) {
        console.log("Recording saved at:", file.path);
        Alert.alert(
          "Recording Complete!",
          `Path: ${file.path}\nName: ${file.name}\nDuration: ${file.duration}s\nSize: ${file.size} bytes`,
        );
        // e.g., uploadRecording(file.path)
      } else {
        Alert.alert("Recording Complete", "Failed to retrieve the file.");
      }
    },
    settledTimeMs: 700, // optional delay before retrieving the file
  });

  const handleStartRecording = async () => {
    console.log("Start recording button pressed");
    try {
      const micStatus = getMicrophonePermissionStatus();
      console.log("Microphone permission status:", micStatus);

      if (micStatus !== "granted") {
        const granted = await requestMicrophonePermission();
        console.log("Microphone permission granted:", granted);
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Microphone permission is needed for audio recording",
          );
          return;
        }
      }

      console.log("Attempting to start global recording...");
      startGlobalRecording({
        options: {
          enableMic: true,
        },
        onRecordingError: (error) => {
          console.error("Recording error:", error);
          Alert.alert("Global recording error", error.message);
        },
      });
      console.log("Start recording called");
    } catch (error) {
      console.error("Error in handleStartRecording:", error);
      Alert.alert("Error", String(error));
    }
  };

  const handleStopRecording = async () => {
    console.log("Stop recording button pressed");
    try {
      const file = await stopGlobalRecording({ settledTimeMs: 1000 });
      console.log("Stop recording result:", file);
      if (file) {
        console.log("Stopped and retrieved file:", file);
        console.log("File path:", file.path);
      } else {
        console.log("No file returned from stopGlobalRecording");
        Alert.alert("No Recording", "No recording file was returned");
      }
    } catch (error) {
      console.error("Error in handleStopRecording:", error);
      Alert.alert("Error", String(error));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require("@/assets/images/cc-love-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.foreground }]}>
            Cupid Copilot
          </Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Your AI-powered relationship companion. Get real-time coaching and
            insights during your conversations to build deeper connections.
          </Text>
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Screen Recording
          </Text>

          {currentDeviceId && (
            <View style={[styles.debugContainer, {
              backgroundColor: theme.muted,
              borderColor: theme.border
            }]}>
              <Text style={[styles.debugLabel, { color: theme.mutedForeground }]}>
                Device ID:
              </Text>
              <Text style={[styles.debugValue, { color: theme.foreground }]} selectable>
                {currentDeviceId}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleStartRecording}
              disabled={isRecording}
            >
              Start Recording
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={handleStopRecording}
              disabled={!isRecording}
            >
              Stop Recording
            </Button>
          </View>

          {isRecording && (
            <View style={[styles.statusBadge, { backgroundColor: theme.destructive }]}>
              <View style={styles.recordingDot} />
              <Text style={[styles.statusText, { color: theme.destructiveForeground }]}>
                Recording is active…
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  recordingSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
