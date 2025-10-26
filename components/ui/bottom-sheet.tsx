import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoint?: number; // Height percentage (0-1)
  backgroundColor?: string;
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoint = 0.5,
  backgroundColor = '#FFFFFF',
}: BottomSheetProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      // Show modal first
      setModalVisible(true);

      // Reset position to off-screen (below viewport)
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;

      // Trigger haptic feedback when opening
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate in - translate to 0 to show at bottom
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 300,
        });
        backdropOpacity.value = withSpring(0.5, {
          damping: 25,
          stiffness: 300,
        });
      });
    } else if (modalVisible) {
      // Animate out - translate down off-screen
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 25,
        stiffness: 300,
      });
      backdropOpacity.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
      });

      // Hide modal after animation completes
      setTimeout(() => {
        setModalVisible(false);
      }, 350);
    }
  }, [isOpen]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!modalVisible) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor },
            sheetAnimatedStyle,
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 200,
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
