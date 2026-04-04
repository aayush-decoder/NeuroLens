import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  createBackupPayload,
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type ProfileData,
} from '@/lib/adaptive-store';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [status, setStatus] = useState('');

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
    setStatus('Backup package created. Opening Google Drive upload page...');
    await WebBrowser.openBrowserAsync('https://drive.google.com/drive/u/0/my-drive');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Update learner settings and manage cloud backup</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Profile details</Text>

        <TextInput
          value={profile.name}
          onChangeText={(name) => setProfile((prev) => ({ ...prev, name }))}
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#718199"
        />

        <TextInput
          value={profile.grade}
          onChangeText={(grade) => setProfile((prev) => ({ ...prev, grade }))}
          style={styles.input}
          placeholder="Grade"
          placeholderTextColor="#718199"
        />

        <TextInput
          value={profile.preferredLanguage}
          onChangeText={(preferredLanguage) => setProfile((prev) => ({ ...prev, preferredLanguage }))}
          style={styles.input}
          placeholder="Preferred language"
          placeholderTextColor="#718199"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dark mode</Text>
          <Switch
            value={profile.darkMode}
            onValueChange={(darkMode) => setProfile((prev) => ({ ...prev, darkMode }))}
          />
        </View>

        <Pressable style={styles.primaryBtn} onPress={updateProfile}>
          <Text style={styles.primaryBtnText}>Save profile</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Backup</Text>
        <Text style={styles.panelBody}>
          Generate a local backup snapshot and upload it to Google Drive from the opened page.
        </Text>
        <Pressable style={styles.secondaryBtn} onPress={backupToDrive}>
          <Text style={styles.secondaryBtnText}>Backup to Google Drive</Text>
        </Pressable>
      </View>

      <View style={styles.panelMuted}>
        <Text style={styles.panelTitle}>Authentication roadmap</Text>
        <Text style={styles.panelBody}>
          Google sign-in and additional providers will be added in the final completion stage, as requested.
        </Text>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EEF3FA',
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
  subtitle: {
    color: '#61728B',
    fontSize: 13,
    marginTop: -2,
  },
  panel: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
  },
  panelMuted: {
    borderRadius: 16,
    backgroundColor: '#E8EEF8',
    padding: 14,
    gap: 10,
  },
  panelTitle: {
    color: '#152642',
    fontSize: 17,
    fontWeight: '800',
  },
  panelBody: {
    color: '#3F526E',
    lineHeight: 21,
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#152642',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  switchLabel: {
    color: '#2D3F59',
    fontSize: 14,
    fontWeight: '600',
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
});
