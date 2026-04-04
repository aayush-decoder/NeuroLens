import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { loginFromMobile, signupFromMobile } from '@/lib/backend-api';
import { saveAuthSession } from '@/lib/auth-store';
import { loadProfile, saveProfile } from '@/lib/adaptive-store';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await signupFromMobile({
        username: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const user = await loginFromMobile({
        email: email.trim().toLowerCase(),
        password,
      });

      await saveAuthSession({
        userId: user.id,
        username: user.username,
        email: user.email,
        createdAt: Date.now(),
      });

      const profile = await loadProfile();
      await saveProfile({
        ...profile,
        name: user.username,
        email: user.email,
        updatedAt: Date.now(),
      });

      router.replace('/(tabs)');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.ScrollView
      style={[styles.page, isDark ? styles.pageDark : null]}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 18, 42) }]}>
      <Animated.View entering={FadeInUp.duration(450)} style={styles.hero}>
        <View style={[styles.logo, isDark ? styles.logoDark : null]}>
          <Text style={styles.logoText}>EN</Text>
        </View>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>Create account</Text>
        <Text style={[styles.sub, isDark ? styles.subDark : null]}>
          Use normal email signup like webapp. Google login comes next.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(70)} style={[styles.card, isDark ? styles.cardDark : null]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Username"
          placeholderTextColor={isDark ? '#8EA3BF' : '#718199'}
          style={[styles.input, isDark ? styles.inputDark : null]}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={isDark ? '#8EA3BF' : '#718199'}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, isDark ? styles.inputDark : null]}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={isDark ? '#8EA3BF' : '#718199'}
          secureTextEntry
          style={[styles.input, isDark ? styles.inputDark : null]}
        />

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor={isDark ? '#8EA3BF' : '#718199'}
          secureTextEntry
          style={[styles.input, isDark ? styles.inputDark : null]}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.cta, loading ? styles.ctaDisabled : null]} onPress={onSignup} disabled={loading}>
          <Text style={styles.ctaText}>{loading ? 'Creating account...' : 'Sign up'}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={[styles.linkText, isDark ? styles.linkTextDark : null]}>
              Already have an account? Sign in
            </Text>
          </Pressable>
        </Link>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF3FA' },
  pageDark: { backgroundColor: '#0F141B' },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  hero: { alignItems: 'center', gap: 6, marginTop: 12 },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#1A6C97',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoDark: { backgroundColor: '#245A81' },
  logoText: { color: '#EFF8FF', fontSize: 26, fontWeight: '900' },
  title: { color: '#132340', fontSize: 28, fontWeight: '900' },
  titleDark: { color: '#EAF2FF' },
  sub: { color: '#61728B', fontSize: 13, textAlign: 'center' },
  subDark: { color: '#99AFCB' },
  card: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardDark: { backgroundColor: '#18212D' },
  input: {
    borderRadius: 12,
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#152642',
  },
  inputDark: { backgroundColor: '#243244', color: '#EAF2FF' },
  error: { color: '#D44A4A', fontSize: 12, fontWeight: '600' },
  cta: {
    borderRadius: 999,
    backgroundColor: '#175E88',
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: '#EBF6FF', fontWeight: '800' },
  linkWrap: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: '#215781', fontWeight: '700' },
  linkTextDark: { color: '#A8C5E7' },
});
