import React from "react";
import { View, Text, Button, Alert } from "react-native";
import {
  useGlobalRecording,
  requestMicrophonePermission,
  getMicrophonePermissionStatus,
  // useMicrophonePermission,
  startGlobalRecording,
  stopGlobalRecording,
} from "react-native-nitro-screen-recorder";

export default function ScreenRecorderExample() {
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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: "center" }}>
        Screen Recorder Demo
      </Text>

      <Button title="Start Global Recording" onPress={handleStartRecording} />
      <Button title="Stop Recording" onPress={handleStopRecording} />

      {isRecording && (
        <Text style={{ marginTop: 10 }}>Recording is active…</Text>
      )}
    </View>
  );
}
