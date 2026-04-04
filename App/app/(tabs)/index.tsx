import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  countWords,
  loadDocuments,
  loadProfile,
  type ProfileData,
  type ReaderDocument,
} from '@/lib/adaptive-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

const GRADIENT_CARDS = [
  { title: 'Library', subtitle: 'Documents', colors: ['#1FA08F', '#3EA3E0'] },
  { title: 'Words', subtitle: 'Total loaded', colors: ['#EA7B49', '#F2B13C'] },
  { title: 'Folders', subtitle: 'Collections', colors: ['#7B67D4', '#3DABE2'] },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const pulse = useSharedValue(1);
  const drift = useSharedValue(0);
  const themeShift = useSharedValue(1);
  const [documents, setDocuments] = useState<ReaderDocument[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [folderInput, setFolderInput] = useState('');
  const [folders, setFolders] = useState<string[]>(['All Files']);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [docs, savedProfile] = await Promise.all([loadDocuments(), loadProfile()]);
        setDocuments(docs);
        setProfile(savedProfile);

        const uniqueFolders = ['All Files', ...new Set(docs.map((doc) => doc.folder))].filter(Boolean);
        setFolders(uniqueFolders.length > 0 ? uniqueFolders : ['All Files']);
      };

      void load();
    }, []),
  );

  const wordCount = useMemo(
    () => documents.reduce((acc, doc) => acc + (doc.wordCount || countWords(doc.text)), 0),
    [documents],
  );

  const addFolder = () => {
    const cleaned = folderInput.trim();
    if (!cleaned || folders.includes(cleaned)) {
      return;
    }
    setFolders((prev) => [...prev, cleaned]);
    setFolderInput('');
  };

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [drift, pulse]);

  useEffect(() => {
    themeShift.value = withSequence(
      withTiming(0.9, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
  }, [isDark, themeShift]);

  const ctaPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * 10 }, { translateX: drift.value * 6 }],
  }));

  const themeShiftStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + themeShift.value * 0.12,
    transform: [{ scale: 0.99 + themeShift.value * 0.01 }],
  }));

  return (
    <Animated.ScrollView
      style={[styles.page, isDark ? styles.pageDark : null, themeShiftStyle]}
      contentContainerStyle={[styles.content, { paddingTop: 14 }]}>
      <Animated.View style={[styles.bgOrbOne, isDark ? styles.bgOrbOneDark : null, orbStyle]} />
      <Animated.View style={[styles.bgOrbTwo, isDark ? styles.bgOrbTwoDark : null]} />

      <Animated.View entering={FadeInUp.duration(450)} style={styles.topBar}>
        <View style={[styles.brandBadge, isDark ? styles.brandBadgeDark : null]}>
          <Text style={styles.brandIcon}>⟡</Text>
        </View>
        <View>
          <Text style={[styles.brandTitle, isDark ? styles.brandTitleDark : null]}>{profile?.name || 'NeuroLens'}</Text>
          <Text style={[styles.brandSub, isDark ? styles.brandSubDark : null]}>Adaptive Reader</Text>
        </View>
      </Animated.View>

      <View style={styles.cardRow}>
        <Animated.View
          entering={FadeInDown.duration(420).delay(60)}
          style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[0].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[0].title}</Text>
          <Text style={styles.cardValue}>{documents.length}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[0].subtitle}</Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(420).delay(130)}
          style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[1].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[1].title}</Text>
          <Text style={styles.cardValue}>{wordCount}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[1].subtitle}</Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(420).delay(200)}
          style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[2].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[2].title}</Text>
          <Text style={styles.cardValue}>{Math.max(folders.length - 1, 0)}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[2].subtitle}</Text>
        </Animated.View>
      </View>

      <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>Folders</Text>
      <View style={styles.folderInputRow}>
        <View style={styles.folderChipPrimary}>
          <Text style={styles.folderChipText}>All Files</Text>
        </View>
        <TextInput
          value={folderInput}
          onChangeText={setFolderInput}
          placeholder="Folder name..."
          placeholderTextColor={isDark ? '#8DA1BB' : '#657285'}
          style={[styles.folderInput, isDark ? styles.folderInputDark : null]}
        />
        <Pressable style={styles.addButton} onPress={addFolder}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.folderWrap}>
        {folders.slice(1).map((folder) => (
          <Animated.View
            key={folder}
            entering={FadeInDown.duration(260)}
            layout={LinearTransition.duration(240)}
            style={[styles.folderChipMuted, isDark ? styles.folderChipMutedDark : null]}>
            <Text style={[styles.folderChipMutedText, isDark ? styles.folderChipMutedTextDark : null]}>{folder}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.duration(450).delay(120)} style={[styles.dropZone, isDark ? styles.dropZoneDark : null]}>
        <Text style={[styles.dropIcon, isDark ? styles.dropIconDark : null]}>⇪</Text>
        <Text style={[styles.dropTitle, isDark ? styles.dropTitleDark : null]}>Drop your .txt or .md files here</Text>
        <Text style={[styles.dropSub, isDark ? styles.dropSubDark : null]}>Files are cleaned and stripped of formatting automatically</Text>
        <Animated.View style={ctaPulseStyle}>
          <Link href="/modal" style={[styles.importCta, isDark ? styles.importCtaDark : null]}>
            <Text style={styles.importCtaText}>Open Import Engine</Text>
          </Link>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450).delay(160)} style={styles.quickActions}>
        <Link href="/(tabs)/reader" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              isDark ? styles.quickCardDark : null,
              pressed ? styles.quickCardPressed : null,
            ]}>
            <Text style={styles.quickTitle}>Start Focus Reading</Text>
            <Text style={styles.quickSub}>Zero-chrome session with adaptive text</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/explore" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.quickCardSecondary,
              isDark ? styles.quickCardSecondaryDark : null,
              pressed ? styles.quickCardPressed : null,
            ]}>
            <Text style={styles.quickTitle}>See Dashboard</Text>
            <Text style={styles.quickSub}>Concept friction and comprehension trends</Text>
          </Pressable>
        </Link>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  pageDark: {
    backgroundColor: '#0F141B',
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 18,
    paddingBottom: 36,
    gap: 14,
  },
  bgOrbOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    top: -40,
    right: -20,
    backgroundColor: 'rgba(90, 176, 255, 0.18)',
  },
  bgOrbOneDark: {
    backgroundColor: 'rgba(57, 122, 191, 0.24)',
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    top: 120,
    left: -40,
    backgroundColor: 'rgba(70, 205, 176, 0.14)',
  },
  bgOrbTwoDark: {
    backgroundColor: 'rgba(31, 96, 88, 0.2)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2C9FBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeDark: {
    backgroundColor: '#205A80',
  },
  brandIcon: {
    color: '#F4FCFF',
    fontSize: 18,
    fontWeight: '700',
  },
  brandTitle: {
    color: '#17273D',
    fontSize: 24,
    fontWeight: '800',
  },
  brandTitleDark: {
    color: '#EAF2FF',
  },
  brandSub: {
    color: '#738195',
    fontSize: 13,
    marginTop: -2,
  },
  brandSubDark: {
    color: '#9FB0C7',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  cardLabel: {
    color: '#EAF8FD',
    fontSize: 16,
    fontWeight: '600',
  },
  cardValue: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 36,
  },
  cardSub: {
    marginTop: 8,
    color: '#D7EFFB',
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 6,
    color: '#6B7687',
    fontSize: 22,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleDark: {
    color: '#A8B8CE',
  },
  folderInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  folderChipPrimary: {
    backgroundColor: '#2EA899',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  folderChipText: {
    color: '#F3FEFD',
    fontWeight: '700',
  },
  folderInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#36A89D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#233149',
  },
  folderInputDark: {
    backgroundColor: '#1D2734',
    borderColor: '#3F5F83',
    color: '#E8F1FF',
  },
  addButton: {
    backgroundColor: '#2EA899',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#F3FEFD',
    fontWeight: '800',
  },
  folderWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  folderChipMuted: {
    backgroundColor: '#E8F2F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  folderChipMutedDark: {
    backgroundColor: '#1E2834',
  },
  folderChipMutedText: {
    color: '#4E6078',
    fontWeight: '600',
  },
  folderChipMutedTextDark: {
    color: '#AFC0D8',
  },
  dropZone: {
    marginTop: 4,
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderColor: '#8DD6CF',
    paddingVertical: 34,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: '#F3FBFA',
  },
  dropZoneDark: {
    backgroundColor: '#16202A',
    borderColor: '#3A6276',
  },
  dropIcon: {
    fontSize: 34,
    color: '#2EA9C4',
  },
  dropIconDark: {
    color: '#6FC8E0',
  },
  dropTitle: {
    marginTop: 8,
    color: '#2A3546',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  dropTitleDark: {
    color: '#D5E4F7',
  },
  dropSub: {
    marginTop: 6,
    color: '#718095',
    fontSize: 14,
    textAlign: 'center',
  },
  dropSubDark: {
    color: '#95A7BF',
  },
  importCta: {
    marginTop: 12,
    backgroundColor: '#1C6C95',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  importCtaDark: {
    backgroundColor: '#1F5478',
  },
  importCtaText: {
    color: '#EAF6FF',
    fontWeight: '700',
  },
  quickActions: {
    marginTop: 8,
    gap: 10,
  },
  quickCard: {
    borderRadius: 16,
    backgroundColor: '#12315B',
    padding: 14,
  },
  quickCardDark: {
    backgroundColor: '#1A2D4D',
  },
  quickCardSecondary: {
    borderRadius: 16,
    backgroundColor: '#354A2A',
    padding: 14,
  },
  quickCardSecondaryDark: {
    backgroundColor: '#2B3F30',
  },
  quickCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  quickTitle: {
    color: '#E9F3FF',
    fontSize: 16,
    fontWeight: '800',
  },
  quickSub: {
    marginTop: 4,
    color: '#C2D3E9',
    fontSize: 13,
  },
});
