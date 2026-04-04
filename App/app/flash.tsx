import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

const FLASH_DURATION_MS = 2200;

export default function FlashScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const pulse = useSharedValue(1);
  const orbit = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 920, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 920, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    orbit.value = withRepeat(withTiming(1, { duration: 3400, easing: Easing.linear }), -1, false);

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, FLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [orbit, pulse]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const orbitOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orbit.value * 14 }, { translateY: orbit.value * -10 }],
  }));

  const orbitTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orbit.value * -10 }, { translateY: orbit.value * 8 }],
  }));

  return (
    <View style={[styles.page, isDark ? styles.pageDark : null]}>
      <Animated.View style={[styles.orbOne, isDark ? styles.orbOneDark : null, orbitOneStyle]} />
      <Animated.View style={[styles.orbTwo, isDark ? styles.orbTwoDark : null, orbitTwoStyle]} />

      <View style={[styles.content, { paddingTop: Math.max(insets.top + 26, 48) }]}>
        <Animated.View entering={FadeInUp.duration(460)} style={[styles.logoWrap, logoStyle]}>
          <Text style={styles.logoGlyph}>EN</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(500).delay(90)} style={[styles.title, isDark ? styles.titleDark : null]}>
          Enfinity Reader
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(170)}
          style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          Adaptive reading intelligence loading...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F7FF',
    justifyContent: 'center',
  },
  pageDark: {
    backgroundColor: '#0D141D',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#1A6C97',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A6C97',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoGlyph: {
    color: '#EFF8FF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    marginTop: 16,
    color: '#122744',
    fontSize: 29,
    fontWeight: '900',
  },
  titleDark: {
    color: '#E8F2FF',
  },
  subtitle: {
    color: '#667A95',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleDark: {
    color: '#9CB0CC',
  },
  orbOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    top: -50,
    right: -40,
    backgroundColor: 'rgba(65, 159, 236, 0.22)',
  },
  orbOneDark: {
    backgroundColor: 'rgba(51, 114, 176, 0.28)',
  },
  orbTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    bottom: -20,
    left: -40,
    backgroundColor: 'rgba(43, 189, 166, 0.2)',
  },
  orbTwoDark: {
    backgroundColor: 'rgba(35, 120, 106, 0.24)',
  },
});