import { useEffect } from 'react';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

export function HapticTab(props: BottomTabBarButtonProps) {
  const pressed = useSharedValue(0);
  const selected = useSharedValue(props.accessibilityState?.selected ? 1 : 0);

  useEffect(() => {
    selected.value = withTiming(props.accessibilityState?.selected ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [props.accessibilityState?.selected, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.06 + selected.value * 0.04 }],
    opacity: 0.86 + selected.value * 0.14,
  }));

  return (
    <PlatformPressable
      {...props}
      style={props.style}
      onPressIn={(ev) => {
        pressed.value = withSpring(1, { damping: 14, stiffness: 240 });
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        pressed.value = withSpring(0, { damping: 15, stiffness: 240 });
        props.onPressOut?.(ev);
      }}>
      <AnimatedView style={animatedStyle}>{props.children}</AnimatedView>
    </PlatformPressable>
  );
}
