import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  countWords,
  loadDocuments,
  loadProfile,
  type ProfileData,
  type ReaderDocument,
} from '@/lib/adaptive-store';

const GRADIENT_CARDS = [
  { title: 'Library', subtitle: 'Documents', colors: ['#1FA08F', '#3EA3E0'] },
  { title: 'Words', subtitle: 'Total loaded', colors: ['#EA7B49', '#F2B13C'] },
  { title: 'Folders', subtitle: 'Collections', colors: ['#7B67D4', '#3DABE2'] },
];

export default function HomeScreen() {
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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandIcon}>⟡</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>{profile?.name || 'AppName'}</Text>
          <Text style={styles.brandSub}>Adaptive Reader</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[0].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[0].title}</Text>
          <Text style={styles.cardValue}>{documents.length}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[0].subtitle}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[1].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[1].title}</Text>
          <Text style={styles.cardValue}>{wordCount}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[1].subtitle}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: GRADIENT_CARDS[2].colors[0] }]}>
          <Text style={styles.cardLabel}>{GRADIENT_CARDS[2].title}</Text>
          <Text style={styles.cardValue}>{Math.max(folders.length - 1, 0)}</Text>
          <Text style={styles.cardSub}>{GRADIENT_CARDS[2].subtitle}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Folders</Text>
      <View style={styles.folderInputRow}>
        <View style={styles.folderChipPrimary}>
          <Text style={styles.folderChipText}>All Files</Text>
        </View>
        <TextInput
          value={folderInput}
          onChangeText={setFolderInput}
          placeholder="Folder name..."
          placeholderTextColor="#657285"
          style={styles.folderInput}
        />
        <Pressable style={styles.addButton} onPress={addFolder}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.folderWrap}>
        {folders.slice(1).map((folder) => (
          <View key={folder} style={styles.folderChipMuted}>
            <Text style={styles.folderChipMutedText}>{folder}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dropZone}>
        <Text style={styles.dropIcon}>⇪</Text>
        <Text style={styles.dropTitle}>Drop your .txt or .md files here</Text>
        <Text style={styles.dropSub}>Files are cleaned and stripped of formatting automatically</Text>
        <Link href="/modal" style={styles.importCta}>
          <Text style={styles.importCtaText}>Open Import Engine</Text>
        </Link>
      </View>

      <View style={styles.quickActions}>
        <Link href="/(tabs)/reader" style={styles.quickCard}>
          <Text style={styles.quickTitle}>Start Focus Reading</Text>
          <Text style={styles.quickSub}>Zero-chrome session with adaptive text</Text>
        </Link>
        <Link href="/(tabs)/explore" style={styles.quickCardSecondary}>
          <Text style={styles.quickTitle}>See Dashboard</Text>
          <Text style={styles.quickSub}>Concept friction and comprehension trends</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 18,
    paddingBottom: 36,
    gap: 14,
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
  brandSub: {
    color: '#738195',
    fontSize: 13,
    marginTop: -2,
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
  folderChipMutedText: {
    color: '#4E6078',
    fontWeight: '600',
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
  dropIcon: {
    fontSize: 34,
    color: '#2EA9C4',
  },
  dropTitle: {
    marginTop: 8,
    color: '#2A3546',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  dropSub: {
    marginTop: 6,
    color: '#718095',
    fontSize: 14,
    textAlign: 'center',
  },
  importCta: {
    marginTop: 12,
    backgroundColor: '#1C6C95',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
  quickCardSecondary: {
    borderRadius: 16,
    backgroundColor: '#354A2A',
    padding: 14,
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
