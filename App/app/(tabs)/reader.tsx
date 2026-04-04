import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
  if (level === 0) {
    return text;
  }

  return Object.entries(SIMPLE_MAP).reduce((current, [hardWord, mapping]) => {
    const regex = new RegExp(`\\b${hardWord}\\b`, 'gi');
    if (level === 1) {
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
  const [session, setSession] = useState<ReaderSession>(DEFAULT_SESSION);
  const [documents, setDocuments] = useState<ReaderDocument[]>([]);
  const [cognateMode, setCognateMode] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('Hindi');

  const lastTick = useRef(Date.now());
  const chrome = useSharedValue(1);
  const fatigue = useSharedValue(0);

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

  const paragraphs = useMemo(() => {
    const primaryDocument = documents.find(
      (doc) => typeof doc?.text === 'string' && doc.text.trim().length > 0,
    );

    if (!primaryDocument) {
      return BASE_PARAGRAPHS;
    }

    return primaryDocument.text
      .split(/\n\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 18);
  }, [documents]);

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
      ['#F7FAFF', '#F5F3EA', '#ECE2CF'],
    ),
  }));

  const lineHeight = 34 + Math.round(session.eyeStrainLoad * 10);
  const fontSize = 19 + session.eyeStrainLoad * 1.5;

  return (
    <Animated.View style={[styles.screen, ambientStyle]}>
      <Animated.View style={[styles.header, topChromeStyle]}>
        <View>
          <Text style={styles.headerTitle}>Focus Reader</Text>
          <Text style={styles.headerSub}>Zero-chrome mode with implicit telemetry</Text>
        </View>
        <Link href="/modal" style={styles.importButton}>
          <Text style={styles.importButtonText}>Import</Text>
        </Link>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}>
        {paragraphs.map((paragraph, index) => (
          <Pressable key={`${index}-${paragraph.slice(0, 16)}`} style={styles.paragraphBlock}>
            <Text style={[styles.paragraph, { lineHeight, fontSize }]}>
              {rewriteText(paragraph, session.simplificationLevel, cognateMode)}
            </Text>
          </Pressable>
        ))}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Multi-lingual cognate mapper</Text>
          <Text style={styles.sectionBody}>
            Assist language: {preferredLanguage}. Toggle to append cognates when repeated stalls are
            detected on hard words.
          </Text>
          <Pressable
            style={[styles.toggleBtn, cognateMode ? styles.toggleBtnOn : null]}
            onPress={() => setCognateMode((prev) => !prev)}>
            <Text style={styles.toggleBtnText}>{cognateMode ? 'Cognates ON' : 'Cognates OFF'}</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.bottomBar, bottomChromeStyle]}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Comprehension</Text>
          <Text style={styles.pillValue}>{session.comprehensionScore}%</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Simplify</Text>
          <Text style={styles.pillValue}>L{session.simplificationLevel}</Text>
        </View>
        <View style={styles.pill}>
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
  header: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#112448',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#F0F6FF',
    fontWeight: '800',
    fontSize: 18,
  },
  headerSub: {
    marginTop: 2,
    color: '#B7C7E1',
    fontSize: 12,
  },
  importButton: {
    borderRadius: 999,
    backgroundColor: '#1D5A85',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  importButtonText: {
    color: '#E8F4FF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 130,
    paddingBottom: 130,
    paddingHorizontal: 24,
    gap: 14,
  },
  paragraphBlock: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  paragraph: {
    color: '#0E192B',
    fontWeight: '500',
  },
  sectionCard: {
    marginTop: 8,
    backgroundColor: '#0F1E36',
    borderRadius: 18,
    padding: 14,
    gap: 6,
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
    bottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#112448',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
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
