import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  DEFAULT_SESSION,
  loadDocuments,
  loadProfile,
  loadSession,
  saveSession,
  type ReaderDocument,
  type ReaderSession,
} from '@/lib/adaptive-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

const BASE_PARAGRAPHS = [
  'Digital reading spaces often add too many panels and controls. The focused reader keeps only the text visible so attention stays on comprehension.',
  'Implicit telemetry monitors pause duration, micro-scroll hesitation, and sudden speed shifts. This gives reading-friction signals in real time.',
  'Dynamic adaptation injects lighter wording and short definitions when the learner repeatedly slows down on complex terms.',
  'Ambient eye-strain support gradually adjusts spacing and contrast during long sessions to reduce fatigue without breaking flow.',
  'At chapter end, the dashboard renders a compact concept-friction graph and auto review sheet for revision.',
];

const SIMPLE_MAP: Record<string, { easy: string; cognate: string }> = {
  comprehension: { easy: 'understanding', cognate: 'samajh' },
  telemetry: { easy: 'tracking', cognate: 'nigrani' },
  adaptation: { easy: 'adjustment', cognate: 'anukulan' },
  contextual: { easy: 'in-text', cognate: 'sandarbhik' },
  revision: { easy: 'review', cognate: 'punravlokan' },
};

function rewriteText(text: string, level: 0 | 1 | 2, withCognates: boolean): string {
  if (level === 0 && !withCognates) {
    return text;
  }

  return Object.entries(SIMPLE_MAP).reduce((current, [hardWord, mapping]) => {
    const regex = new RegExp(`\\b${hardWord}\\b`, 'gi');
    if (level === 1 && !withCognates) {
      return current.replace(regex, mapping.easy);
    }
    const replacement = withCognates
      ? `${mapping.easy} (${mapping.cognate})`
      : `${hardWord} (${mapping.easy})`;
    return current.replace(regex, replacement);
  }, text);
}

function makeConceptFriction(score: number): Array<{ concept: string; score: number }> {
  return [
    { concept: 'Vocabulary load', score: Math.min(1, 0.18 + score * 0.8) },
    { concept: 'Inference depth', score: Math.min(1, 0.12 + score * 0.66) },
    { concept: 'Retention', score: Math.min(1, 0.1 + score * 0.48) },
  ];
}

export default function ReaderScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [session, setSession] = useState<ReaderSession>(DEFAULT_SESSION);
  const [documents, setDocuments] = useState<ReaderDocument[]>([]);
  const [cognateMode, setCognateMode] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState('Hindi');

  const lastTick = useRef(Date.now());
  const chrome = useSharedValue(1);
  const fatigue = useSharedValue(0);
  const themeShift = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      const loadAll = async () => {
        const [savedSession, savedDocuments, profile] = await Promise.all([
          loadSession(),
          loadDocuments(),
          loadProfile(),
        ]);
        setSession(savedSession);
        setDocuments(savedDocuments);
        setPreferredLanguage(profile.preferredLanguage);
      };

      void loadAll();
    }, []),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSession((prev) => {
        const next = {
          ...prev,
          sessionSeconds: prev.sessionSeconds + 1,
          updatedAt: Date.now(),
        };
        void saveSession(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fatigue.value = withTiming(Math.min(session.sessionSeconds / (35 * 60), 1), { duration: 260 });
  }, [fatigue, session.sessionSeconds]);

  useEffect(() => {
    themeShift.value = withSequence(
      withTiming(0.9, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
  }, [isDark, themeShift]);

  const primaryDocument = useMemo(
    () =>
      documents.find(
        (doc) => typeof doc?.text === 'string' && doc.text.trim().length > 0,
      ) ?? null,
    [documents],
  );

  const paragraphs = useMemo(() => {
    if (!primaryDocument) {
      return BASE_PARAGRAPHS;
    }

    return primaryDocument.text
      .split(/\n\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 18);
  }, [primaryDocument]);

  const estimatedReadMinutes = useMemo(() => {
    const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [paragraphs]);

  const simplifiedTextRatio = useMemo(() => {
    if (session.simplificationLevel === 0) {
      return 'Original';
    }
    if (session.simplificationLevel === 1) {
      return 'Light Assist';
    }
    return 'Deep Assist';
  }, [session.simplificationLevel]);

  const cognateHits = useMemo(() => {
    const merged = paragraphs.join(' ').toLowerCase();
    return Object.keys(SIMPLE_MAP).filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(merged)).length;
  }, [paragraphs]);

  const readingProgress = useMemo(() => {
    const maxDepth = paragraphs.length * 320;
    return Math.min(100, Math.round((session.scrollDepth / Math.max(1, maxDepth)) * 100));
  }, [paragraphs.length, session.scrollDepth]);

  const applyTelemetry = useCallback((offsetY: number, velocity: number) => {
    const now = Date.now();
    const delta = now - lastTick.current;
    if (delta < 90) {
      return;
    }

    lastTick.current = now;

    setSession((prev) => {
      const abs = Math.abs(velocity);
      const isPause = abs < 0.04;
      const isHesitation = abs >= 0.04 && abs <= 0.13;

      const dwellIncrease = isPause ? delta : delta * 0.14;
      const hesitation = Math.max(0, Math.min(1, prev.hesitationScore + (isHesitation ? 0.06 : -0.02)));
      const simplificationLevel: 0 | 1 | 2 = hesitation > 0.65 ? 2 : hesitation > 0.35 ? 1 : 0;
      const comprehensionScore = Math.round(
        Math.max(
          45,
          Math.min(97, 84 + Math.min((prev.dwellMs + dwellIncrease) / 39000, 9) - hesitation * 20),
        ),
      );

      const next: ReaderSession = {
        ...prev,
        scrollVelocity: velocity,
        dwellMs: prev.dwellMs + dwellIncrease,
        hesitationScore: hesitation,
        simplificationLevel,
        comprehensionScore,
        scrollDepth: Math.max(prev.scrollDepth, Math.round(offsetY)),
        eyeStrainLoad: Math.min(1, (prev.sessionSeconds + 1) / (40 * 60)),
        stalledWord: hesitation > 0.48 ? 'comprehension' : 'contextual',
        stalledWordCount: isHesitation ? prev.stalledWordCount + 1 : Math.max(0, prev.stalledWordCount - 1),
        conceptFriction: makeConceptFriction(hesitation),
        updatedAt: now,
      };

      void saveSession(next);
      return next;
    });
  }, []);

  const scrollHandler = useAnimatedScrollHandler<{ lastY: number; lastTs: number }>({
    onBeginDrag: (event, ctx) => {
      'worklet';
      ctx.lastY = event.contentOffset.y;
      ctx.lastTs = Date.now();
    },
    onScroll: (event, ctx) => {
      'worklet';
      const now = Date.now();
      const dy = event.contentOffset.y - (ctx.lastY ?? 0);
      const dt = Math.max(1, now - (ctx.lastTs ?? now));
      const velocity = dy / dt;

      ctx.lastY = event.contentOffset.y;
      ctx.lastTs = now;

      const hideChrome = Math.abs(velocity) > 0.45;
      chrome.value = withTiming(hideChrome ? 0 : 1, { duration: hideChrome ? 120 : 220 });
      runOnJS(applyTelemetry)(event.contentOffset.y, velocity);
    },
    onMomentumBegin: () => {
      'worklet';
      chrome.value = withTiming(0, { duration: 120 });
    },
    onMomentumEnd: () => {
      'worklet';
      chrome.value = withTiming(1, { duration: 260 });
    },
  });

  const topChromeStyle = useAnimatedStyle(() => ({
    opacity: chrome.value,
    transform: [{ translateY: interpolate(chrome.value, [0, 1], [-54, 0]) }],
  }));

  const bottomChromeStyle = useAnimatedStyle(() => ({
    opacity: chrome.value,
    transform: [{ translateY: interpolate(chrome.value, [0, 1], [56, 0]) }],
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      fatigue.value,
      [0, 0.5, 1],
      isDark ? ['#0E141C', '#111923', '#151E2A'] : ['#F3F8FF', '#F4F0E4', '#E8DECA'],
    ),
  }));

  const themeShiftStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + themeShift.value * 0.12,
    transform: [{ scale: 0.99 + themeShift.value * 0.01 }],
  }));

  const lineHeight = (focusMode ? 35 : 31) + Math.round(session.eyeStrainLoad * 8);
  const fontSize = (focusMode ? 21 : 18.5) + session.eyeStrainLoad * 1.2;
  const headerTop = Math.max(insets.top + 8, 48);
  const scrollTop = headerTop + 78;
  const tabBarReserve = 96;
  const bottomOffset = Math.max(insets.bottom + tabBarReserve, 104);

  return (
    <Animated.View style={[styles.screen, ambientStyle, themeShiftStyle]}>
      <View style={[styles.bgOrbOne, isDark ? styles.bgOrbOneDark : null]} />
      <View style={[styles.bgOrbTwo, isDark ? styles.bgOrbTwoDark : null]} />
      <View style={[styles.bgGrain, isDark ? styles.bgGrainDark : null]} />

      <Animated.View style={[styles.header, isDark ? styles.headerDark : null, topChromeStyle, { top: headerTop }]}>
        <View>
          <Text style={[styles.headerTitle, isDark ? styles.headerTitleDark : null]}>Focus Reader</Text>
          <Text style={[styles.headerSub, isDark ? styles.headerSubDark : null]}>
            {primaryDocument?.title || 'Reading Session'} • {estimatedReadMinutes} min read
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.focusSwitch, isDark ? styles.focusSwitchDark : null, focusMode ? styles.focusSwitchOn : null]}
            onPress={() => setFocusMode((prev) => !prev)}>
            <Text style={styles.focusSwitchText}>{focusMode ? 'Focus On' : 'Focus Off'}</Text>
          </Pressable>
          <Link href="/modal" style={styles.importButton}>
            <Text style={styles.importButtonText}>Import</Text>
          </Link>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollTop, paddingBottom: bottomOffset + 126 }]}>
        <View style={[styles.readerMetaCard, isDark ? styles.readerMetaCardDark : null]}>
          <View style={[styles.metaChip, isDark ? styles.metaChipDark : null]}>
            <Text style={styles.metaLabel}>Assist</Text>
            <Text style={styles.metaValue}>{simplifiedTextRatio}</Text>
          </View>
          <View style={[styles.metaChip, isDark ? styles.metaChipDark : null]}>
            <Text style={styles.metaLabel}>Progress</Text>
            <Text style={styles.metaValue}>{readingProgress}%</Text>
          </View>
          <View style={[styles.metaChip, isDark ? styles.metaChipDark : null]}>
            <Text style={styles.metaLabel}>Language</Text>
            <Text style={styles.metaValue}>{preferredLanguage}</Text>
          </View>
        </View>

        {paragraphs.map((paragraph, index) => (
          <Pressable
            key={`${index}-${paragraph.slice(0, 16)}`}
            style={[
              styles.paragraphBlock,
              isDark ? styles.paragraphBlockDark : null,
              focusMode ? (isDark ? styles.paragraphBlockFocusDark : styles.paragraphBlockFocus) : null,
            ]}>
            <Text style={[styles.paragraph, isDark ? styles.paragraphDark : null, { lineHeight, fontSize }]}>
              {rewriteText(paragraph, session.simplificationLevel, cognateMode)}
            </Text>
          </Pressable>
        ))}

        <View style={[styles.sectionCard, isDark ? styles.sectionCardDark : null]}>
          <Text style={styles.sectionTitle}>Multi-lingual cognate mapper</Text>
          <Text style={styles.sectionBody}>
            Assist language: {preferredLanguage}. Toggle to append cognates when repeated stalls are
            detected on hard words.
          </Text>
          <Text style={styles.sectionHint}>
            {cognateHits > 0
              ? `Detected ${cognateHits} target term${cognateHits > 1 ? 's' : ''} in this text.`
              : 'No mapped terms detected yet. Import richer text to see cognate annotations.'}
          </Text>
          <Pressable
            style={[styles.toggleBtn, cognateMode ? styles.toggleBtnOn : null]}
            onPress={() => setCognateMode((prev) => !prev)}>
            <Text style={styles.toggleBtnText}>{cognateMode ? 'Cognates ON' : 'Cognates OFF'}</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.bottomBar, bottomChromeStyle, { bottom: bottomOffset }]}>
        <View style={[styles.pill, isDark ? styles.pillDark : null]}>
          <Text style={styles.pillLabel}>Comprehension</Text>
          <Text style={styles.pillValue}>{session.comprehensionScore}%</Text>
        </View>
        <View style={[styles.pill, isDark ? styles.pillDark : null]}>
          <Text style={styles.pillLabel}>Simplify</Text>
          <Text style={styles.pillValue}>L{session.simplificationLevel}</Text>
        </View>
        <View style={[styles.pill, isDark ? styles.pillDark : null]}>
          <Text style={styles.pillLabel}>Stalled term</Text>
          <Text style={styles.pillValue}>{session.stalledWord}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgOrbOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(88, 143, 255, 0.18)',
    top: -40,
    right: -40,
  },
  bgOrbOneDark: {
    backgroundColor: 'rgba(76, 123, 212, 0.14)',
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(69, 198, 178, 0.16)',
    bottom: 110,
    left: -80,
  },
  bgOrbTwoDark: {
    backgroundColor: 'rgba(42, 115, 108, 0.14)',
  },
  bgGrain: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bgGrainDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 26, 49, 0.86)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(184, 210, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerDark: {
    backgroundColor: 'rgba(9, 15, 24, 0.9)',
    borderColor: 'rgba(112, 139, 178, 0.24)',
  },
  headerTitle: {
    color: '#F5FAFF',
    fontWeight: '800',
    fontSize: 18,
  },
  headerTitleDark: {
    color: '#E8F1FF',
  },
  headerSub: {
    marginTop: 3,
    color: '#C6D8F8',
    fontSize: 12,
  },
  headerSubDark: {
    color: '#A5B9D6',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusSwitch: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#5A82B7',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  focusSwitchDark: {
    borderColor: '#4F6F98',
    backgroundColor: 'rgba(160, 190, 230, 0.08)',
  },
  focusSwitchOn: {
    borderColor: '#7EE3D3',
    backgroundColor: 'rgba(59, 153, 137, 0.24)',
  },
  focusSwitchText: {
    color: '#E7F3FF',
    fontSize: 11,
    fontWeight: '700',
  },
  importButton: {
    borderRadius: 999,
    backgroundColor: '#235D89',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  importButtonText: {
    color: '#E8F4FF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  readerMetaCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(143, 173, 219, 0.35)',
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  readerMetaCardDark: {
    backgroundColor: 'rgba(24, 35, 51, 0.9)',
    borderColor: 'rgba(88, 116, 153, 0.34)',
  },
  metaChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 49, 88, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metaChipDark: {
    backgroundColor: 'rgba(14, 25, 39, 0.95)',
  },
  metaLabel: {
    color: '#ABC4E7',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    marginTop: 2,
    color: '#F4F9FF',
    fontSize: 13,
    fontWeight: '800',
  },
  paragraphBlock: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(132, 166, 214, 0.26)',
  },
  paragraphBlockDark: {
    backgroundColor: 'rgba(22, 33, 49, 0.9)',
    borderColor: 'rgba(85, 113, 150, 0.3)',
  },
  paragraphBlockFocus: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(120, 156, 208, 0.34)',
  },
  paragraphBlockFocusDark: {
    backgroundColor: 'rgba(30, 43, 62, 0.95)',
    borderColor: 'rgba(102, 134, 176, 0.44)',
  },
  paragraph: {
    color: '#152238',
    fontWeight: '500',
    fontFamily: 'serif',
    letterSpacing: 0.2,
  },
  paragraphDark: {
    color: '#DFEBFF',
  },
  sectionCard: {
    marginTop: 8,
    backgroundColor: 'rgba(10, 20, 38, 0.92)',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  sectionCardDark: {
    backgroundColor: 'rgba(7, 13, 22, 0.94)',
  },
  sectionTitle: {
    color: '#EAF2FF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBody: {
    color: '#C3D1E8',
    lineHeight: 20,
    fontSize: 13,
  },
  sectionHint: {
    marginTop: 2,
    color: '#86E4CD',
    fontSize: 12,
    lineHeight: 18,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#385072',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleBtnOn: {
    backgroundColor: '#2D7A57',
  },
  toggleBtnText: {
    color: '#EAF6FF',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(11, 24, 45, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(157, 183, 224, 0.22)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pillDark: {
    backgroundColor: 'rgba(7, 14, 24, 0.92)',
    borderColor: 'rgba(103, 130, 168, 0.24)',
  },
  pillLabel: {
    color: '#A5BCD9',
    fontSize: 10,
    fontWeight: '600',
  },
  pillValue: {
    color: '#F0F6FF',
    fontSize: 13,
    fontWeight: '800',
  },
});
