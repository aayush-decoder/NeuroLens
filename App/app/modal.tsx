import { Link } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

import { countWords, loadDocuments, saveDocuments, stripFormatting } from '@/lib/adaptive-store';
import { adaptText, getBackendBaseUrl } from '@/lib/backend-api';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const themeShift = useSharedValue(1);
  const [rawText, setRawText] = useState('');
  const [folder, setFolder] = useState('General');
  const [title, setTitle] = useState('Untitled Document');
  const [savedState, setSavedState] = useState('');
  const [importing, setImporting] = useState(false);
  const [refining, setRefining] = useState(false);

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

  const importFromPhoneStorage = async () => {
    try {
      setImporting(true);
      setSavedState('');

      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ['text/plain', 'text/markdown', 'application/json', 'text/*'],
      });

      if (picked.canceled || picked.assets.length === 0) {
        setSavedState('Import canceled.');
        return;
      }

      const asset = picked.assets[0];
      const text = await FileSystem.readAsStringAsync(asset.uri);

      setRawText(text);

      if (!title.trim() || title === 'Untitled Document') {
        const fallbackTitle = asset.name?.replace(/\.[^.]+$/, '') || 'Imported Document';
        setTitle(fallbackTitle);
      }

      setSavedState(`Imported ${asset.name || 'document'} from phone storage.`);
    } catch {
      setSavedState('Unable to import this file. Choose a UTF-8 text file (.txt, .md, .json).');
    } finally {
      setImporting(false);
    }
  };

  const refineWithBackend = async () => {
    if (!cleaned) {
      setSavedState('Add text first before backend refinement.');
      return;
    }

    try {
      setRefining(true);
      const adapted = await adaptText(cleaned, []);
      if (adapted.trim()) {
        setRawText(adapted);
        setSavedState('AI refinement synced from backend.');
      }
    } catch {
      setSavedState('Backend refinement unavailable right now.');
    } finally {
      setRefining(false);
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
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 10, 58) }]}>
      <Animated.View entering={FadeInUp.duration(360)} style={[styles.heroCard, isDark ? styles.heroCardDark : null]}>
        <Text style={styles.title}>Import Studio</Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          Bring raw files from phone storage, clean noise, and push text into a distraction-free reader.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(70)} style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, isDark ? styles.fieldLabelDark : null]}>Document Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Document title"
          placeholderTextColor={isDark ? '#8DA1BC' : '#728097'}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(120)} style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, isDark ? styles.fieldLabelDark : null]}>Folder</Text>
        <TextInput
          value={folder}
          onChangeText={setFolder}
          style={[styles.input, isDark ? styles.inputDark : null]}
          placeholder="Folder"
          placeholderTextColor={isDark ? '#8DA1BC' : '#728097'}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(170)} style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, isDark ? styles.fieldLabelDark : null]}>Raw Text</Text>
        <TextInput
          value={rawText}
          onChangeText={setRawText}
          style={[styles.textArea, isDark ? styles.inputDark : null]}
          multiline
          placeholder="Paste raw text here"
          placeholderTextColor={isDark ? '#8DA1BC' : '#728097'}
          textAlignVertical="top"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(220)}>
        <Pressable
        style={[styles.importFromPhoneButton, isDark ? styles.importFromPhoneButtonDark : null, importing ? styles.importFromPhoneButtonDisabled : null]}
        onPress={importFromPhoneStorage}
        disabled={importing}>
        <Text style={[styles.importFromPhoneButtonText, isDark ? styles.importFromPhoneButtonTextDark : null]}>
          {importing ? 'Importing...' : 'Import from phone storage'}
        </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(250)}>
        <Pressable
          style={[
            styles.importFromPhoneButton,
            isDark ? styles.importFromPhoneButtonDark : null,
            refining ? styles.importFromPhoneButtonDisabled : null,
          ]}
          onPress={refineWithBackend}
          disabled={refining}>
          <Text style={[styles.importFromPhoneButtonText, isDark ? styles.importFromPhoneButtonTextDark : null]}>
            {refining ? 'Refining...' : 'Refine with AI backend'}
          </Text>
        </Pressable>
      </Animated.View>

      <Text style={[styles.previewLabel, isDark ? styles.previewLabelDark : null]}>Clean preview</Text>
      <Animated.View entering={FadeInDown.duration(340).delay(260)} style={[styles.previewBox, isDark ? styles.previewBoxDark : null]}>
        <Text style={[styles.previewText, isDark ? styles.previewTextDark : null]}>{cleaned || 'No text yet.'}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(340).delay(300)}>
        <Pressable style={[styles.saveButton, isDark ? styles.saveButtonDark : null]} onPress={saveDoc}>
          <Text style={styles.saveButtonText}>Save cleaned document</Text>
        </Pressable>
      </Animated.View>

      {savedState ? <Text style={[styles.savedState, isDark ? styles.savedStateDark : null]}>{savedState}</Text> : null}
      <Text style={[styles.fieldLabel, isDark ? styles.fieldLabelDark : null]}>Connected backend: {getBackendBaseUrl()}</Text>

      <Link href="/(tabs)" dismissTo style={styles.link}>
        <Text style={[styles.linkText, isDark ? styles.linkTextDark : null]}>Back to Home</Text>
      </Link>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EAF1FA',
  },
  pageDark: {
    backgroundColor: '#0F141B',
  },
  content: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 12,
  },
  heroCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#10294D',
    borderWidth: 1,
    borderColor: '#2F4F79',
  },
  heroCardDark: {
    backgroundColor: '#1A2431',
    borderColor: '#324760',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#34516E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldLabelDark: {
    color: '#96ABC9',
  },
  title: {
    color: '#F1F7FF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#C0D3EB',
    fontSize: 13,
    lineHeight: 19,
  },
  subtitleDark: {
    color: '#A7BCD7',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B9CDE7',
    backgroundColor: '#FDFEFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#12233F',
  },
  inputDark: {
    borderColor: '#3F5775',
    backgroundColor: '#1F2C3D',
    color: '#E8F1FF',
  },
  textArea: {
    minHeight: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B9CDE7',
    backgroundColor: '#FDFEFF',
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
  previewLabelDark: {
    color: '#96ABC9',
  },
  previewBox: {
    minHeight: 130,
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewBoxDark: {
    backgroundColor: '#1B2736',
  },
  previewText: {
    color: '#1D2D44',
    lineHeight: 21,
    fontSize: 14,
  },
  previewTextDark: {
    color: '#D8E5F7',
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#1F6F93',
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonDark: {
    backgroundColor: '#245A81',
  },
  saveButtonText: {
    color: '#E9F5FF',
    fontWeight: '800',
  },
  importFromPhoneButton: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F6F93',
    backgroundColor: '#EAF6FF',
    paddingVertical: 11,
    alignItems: 'center',
  },
  importFromPhoneButtonDark: {
    borderColor: '#4A7298',
    backgroundColor: '#1B2A3B',
  },
  importFromPhoneButtonDisabled: {
    opacity: 0.6,
  },
  importFromPhoneButtonText: {
    color: '#134467',
    fontWeight: '800',
  },
  importFromPhoneButtonTextDark: {
    color: '#C9DEF8',
  },
  savedState: {
    color: '#2D8158',
    fontSize: 13,
    fontWeight: '700',
  },
  savedStateDark: {
    color: '#78D2A0',
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
  linkTextDark: {
    color: '#9FC2E7',
  },
});
