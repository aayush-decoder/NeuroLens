import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  cancelBackupReminderNotification,
  scheduleBackupReminderNotification,
} from '@/lib/backup-notifications';
import {
  createBackupPayload,
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type ProfileData,
} from '@/lib/adaptive-store';
import { getBackendBaseUrl, registerFromMobile } from '@/lib/backend-api';
import { setPreferredColorScheme, useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeShift = useSharedValue(1);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [status, setStatus] = useState('');
  const [registering, setRegistering] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const saved = await loadProfile();
        setProfile(saved);
      };

      void load();
    }, []),
  );

  const updateProfile = async () => {
    const next = { ...profile, updatedAt: Date.now() };
    await saveProfile(next);
    setStatus('Profile updated.');
  };

  const backupToDrive = async () => {
    await createBackupPayload();
    const next = { ...profile, lastBackupAt: Date.now(), updatedAt: Date.now() };
    setProfile(next);
    await saveProfile(next);

    if (next.backupReminders) {
      await scheduleBackupReminderNotification();
    }

    setStatus('Backup package created. Opening Google Drive upload page...');
    await WebBrowser.openBrowserAsync('https://drive.google.com/drive/u/0/my-drive');
  };

  const toggleBackupReminders = async (enabled: boolean) => {
    if (enabled) {
      const scheduled = await scheduleBackupReminderNotification();
      if (!scheduled) {
        const deniedProfile = { ...profile, backupReminders: false, updatedAt: Date.now() };
        setProfile(deniedProfile);
        await saveProfile(deniedProfile);
        setStatus('Notification permission denied. Enable notifications to use backup reminders.');
        return;
      }
    } else {
      await cancelBackupReminderNotification();
    }

    const next = { ...profile, backupReminders: enabled, updatedAt: Date.now() };
    setProfile(next);
    await saveProfile(next);
    setStatus(enabled ? 'Backup reminders enabled.' : 'Backup reminders disabled.');
  };

  const toggleDarkMode = async (darkMode: boolean) => {
    const next = { ...profile, darkMode, updatedAt: Date.now() };
    setProfile(next);
    await saveProfile(next);
    setPreferredColorScheme(darkMode ? 'dark' : 'light');
    setStatus(`Theme switched to ${darkMode ? 'dark' : 'light'} mode.`);
  };

  const connectBackendAccount = async () => {
    const username = profile.name.trim().replace(/\s+/g, '_').toLowerCase() || `reader_${Date.now()}`;
    const email = profile.email.trim().toLowerCase();

    if (!email.includes('@')) {
      setStatus('Enter a valid email to create backend account.');
      return;
    }

    try {
      setRegistering(true);
      await registerFromMobile({
        username,
        email,
        password: 'Reader@12345',
      });
      setStatus('Backend account connected.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect backend account.';
      setStatus(message);
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    themeShift.value = withSequence(
      withTiming(0.9, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
  }, [isDark, themeShift]);

  const themeShiftStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + themeShift.value * 0.12,
    transform: [{ scale: 0.99 + themeShift.value * 0.01 }],
  }));

  return (
    <Animated.ScrollView
      style={[styles.page, isDark ? styles.pageDark : null, themeShiftStyle]}
      contentContainerStyle={[styles.content, { paddingTop: 14 }]}>
      <Animated.Text entering={FadeInUp.duration(360)} style={[styles.title, isDark ? styles.titleDark : null]}>Profile</Animated.Text>
      <Animated.Text entering={FadeInUp.duration(360).delay(60)} style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
        Update learner settings and manage cloud backup
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(380).delay(120)} style={[styles.panel, isDark ? styles.panelDark : null]}>
        <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : null]}>Profile details</Text>

        <TextInput
          value={profile.name}
          onChangeText={(name) => setProfile((prev) => ({ ...prev, name }))}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Name"
          placeholderTextColor={isDark ? '#7E8BA0' : '#718199'}
        />

        <TextInput
          value={profile.email}
          onChangeText={(email) => setProfile((prev) => ({ ...prev, email }))}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Email"
          placeholderTextColor={isDark ? '#7E8BA0' : '#718199'}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          value={profile.grade}
          onChangeText={(grade) => setProfile((prev) => ({ ...prev, grade }))}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Grade"
          placeholderTextColor={isDark ? '#7E8BA0' : '#718199'}
        />

        <TextInput
          value={profile.preferredLanguage}
          onChangeText={(preferredLanguage) => setProfile((prev) => ({ ...prev, preferredLanguage }))}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Preferred language"
          placeholderTextColor={isDark ? '#7E8BA0' : '#718199'}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, isDark ? styles.switchLabelDark : null]}>Dark mode</Text>
          <View style={styles.switchWrap}>
            <Text style={[styles.switchState, isDark ? styles.switchStateDark : null]}>
              {profile.darkMode ? 'ON' : 'OFF'}
            </Text>
            <Switch value={profile.darkMode} onValueChange={toggleDarkMode} />
          </View>
        </View>

        <Pressable style={styles.primaryBtn} onPress={updateProfile}>
          <Text style={styles.primaryBtnText}>Save profile</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={connectBackendAccount} disabled={registering}>
          <Text style={styles.secondaryBtnText}>{registering ? 'Connecting...' : 'Connect backend account'}</Text>
        </Pressable>

        <Text style={[styles.panelBody, isDark ? styles.panelBodyDark : null]}>
          Backend URL: {getBackendBaseUrl()}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(380).delay(180)} style={[styles.panel, isDark ? styles.panelDark : null]}>
        <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : null]}>Backup</Text>
        <Text style={[styles.panelBody, isDark ? styles.panelBodyDark : null]}>
          Generate a local backup snapshot and upload it to Google Drive from the opened page.
        </Text>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, isDark ? styles.switchLabelDark : null]}>Backup reminders</Text>
          <View style={styles.switchWrap}>
            <Text style={[styles.switchState, isDark ? styles.switchStateDark : null]}>
              {profile.backupReminders ? 'ON' : 'OFF'}
            </Text>
            <Switch value={profile.backupReminders} onValueChange={toggleBackupReminders} />
          </View>
        </View>

        {profile.lastBackupAt ? (
          <Text style={[styles.panelBody, isDark ? styles.panelBodyDark : null]}>
            Last backup: {new Date(profile.lastBackupAt).toLocaleString()}
          </Text>
        ) : null}

        <Pressable style={styles.secondaryBtn} onPress={backupToDrive}>
          <Text style={styles.secondaryBtnText}>Backup to Google Drive</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(380).delay(230)} style={[styles.panelMuted, isDark ? styles.panelMutedDark : null]}>
        <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : null]}>Authentication roadmap</Text>
        <Text style={[styles.panelBody, isDark ? styles.panelBodyDark : null]}>
          Google sign-in and additional providers will be added in the final completion stage, as requested.
        </Text>
      </Animated.View>

      {status ? <Text style={[styles.status, isDark ? styles.statusDark : null]}>{status}</Text> : null}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EEF3FA',
  },
  pageDark: {
    backgroundColor: '#0F141B',
  },
  content: {
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 34,
    gap: 12,
  },
  title: {
    color: '#132340',
    fontSize: 28,
    fontWeight: '800',
  },
  titleDark: {
    color: '#EAF2FF',
  },
  subtitle: {
    color: '#61728B',
    fontSize: 13,
    marginTop: -2,
  },
  subtitleDark: {
    color: '#9AA9BE',
  },
  panel: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
  },
  panelDark: {
    backgroundColor: '#18212D',
  },
  panelMuted: {
    borderRadius: 16,
    backgroundColor: '#E8EEF8',
    padding: 14,
    gap: 10,
  },
  panelMutedDark: {
    backgroundColor: '#1C2838',
  },
  panelTitle: {
    color: '#152642',
    fontSize: 17,
    fontWeight: '800',
  },
  panelTitleDark: {
    color: '#EAF2FF',
  },
  panelBody: {
    color: '#3F526E',
    lineHeight: 21,
    fontSize: 14,
  },
  panelBodyDark: {
    color: '#B8C6D8',
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#152642',
  },
  inputDark: {
    backgroundColor: '#243244',
    color: '#EAF2FF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    color: '#2D3F59',
    fontSize: 14,
    fontWeight: '600',
  },
  switchLabelDark: {
    color: '#D4E2F4',
  },
  switchState: {
    color: '#4F6180',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  switchStateDark: {
    color: '#9CB2D1',
  },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#175E88',
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#EBF6FF',
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 2,
    borderRadius: 999,
    backgroundColor: '#274D74',
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#EBF6FF',
    fontWeight: '800',
  },
  status: {
    color: '#286D4A',
    fontSize: 13,
    fontWeight: '700',
  },
  statusDark: {
    color: '#75D89E',
  },
});
