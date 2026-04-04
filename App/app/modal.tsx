import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { countWords, loadDocuments, saveDocuments, stripFormatting } from '@/lib/adaptive-store';

export default function ModalScreen() {
  const [rawText, setRawText] = useState('');
  const [folder, setFolder] = useState('General');
  const [title, setTitle] = useState('Untitled Document');
  const [savedState, setSavedState] = useState('');

  const cleaned = stripFormatting(rawText);

  const saveDoc = async () => {
    if (!cleaned) {
      setSavedState('Please paste some text first.');
      return;
    }

    const existing = await loadDocuments();
    const next = [
      {
        id: `${Date.now()}`,
        folder: folder.trim() || 'General',
        title: title.trim() || 'Untitled Document',
        text: cleaned,
        wordCount: countWords(cleaned),
        createdAt: Date.now(),
      },
      ...existing,
    ];
    await saveDocuments(next);
    setSavedState('Saved and cleaned successfully.');
    setRawText('');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Local Document Stripping Engine</Text>
      <Text style={styles.subtitle}>
        Paste .txt or .md content, auto-clean formatting, and inject it into the adaptive reader.
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Document title"
        placeholderTextColor="#728097"
      />

      <TextInput
        value={folder}
        onChangeText={setFolder}
        style={styles.input}
        placeholder="Folder"
        placeholderTextColor="#728097"
      />

      <TextInput
        value={rawText}
        onChangeText={setRawText}
        style={styles.textArea}
        multiline
        placeholder="Paste raw text here"
        placeholderTextColor="#728097"
        textAlignVertical="top"
      />

      <Text style={styles.previewLabel}>Clean preview</Text>
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{cleaned || 'No text yet.'}</Text>
      </View>

      <Pressable style={styles.saveButton} onPress={saveDoc}>
        <Text style={styles.saveButtonText}>Save cleaned document</Text>
      </Pressable>

      {savedState ? <Text style={styles.savedState}>{savedState}</Text> : null}

      <Link href="/(tabs)" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Back to Home</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EBF1F9',
  },
  content: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 10,
  },
  title: {
    color: '#12233F',
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: '#647692',
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#12233F',
  },
  textArea: {
    minHeight: 150,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#12233F',
  },
  previewLabel: {
    marginTop: 2,
    color: '#385072',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewBox: {
    minHeight: 130,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewText: {
    color: '#1D2D44',
    lineHeight: 21,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#1F6F93',
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#E9F5FF',
    fontWeight: '800',
  },
  savedState: {
    color: '#2D8158',
    fontSize: 13,
    fontWeight: '700',
  },
  link: {
    marginTop: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  linkText: {
    color: '#134467',
    fontWeight: '700',
  },
});
