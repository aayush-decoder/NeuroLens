import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { countWords, loadDocuments, loadSession, type ReaderDocument, type ReaderSession } from '@/lib/adaptive-store';
import { analyzeSession } from '@/lib/backend-api';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const themeShift = useSharedValue(1);
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [docs, setDocs] = useState<ReaderDocument[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'running' | 'ready' | 'error'>('idle');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [savedSession, savedDocs] = await Promise.all([loadSession(), loadDocuments()]);
        setSession(savedSession);
        setDocs(savedDocs);
      };

      void load();
    }, []),
  );

  const words = useMemo(
    () => docs.reduce((acc, doc) => acc + (doc.wordCount || countWords(doc.text)), 0),
    [docs],
  );

  const metrics = [
    { label: 'Comprehension', value: `${session?.comprehensionScore ?? 0}%` },
    { label: 'Dwell', value: `${Math.round((session?.dwellMs ?? 0) / 1000)}s` },
    { label: 'Scroll depth', value: `${session?.scrollDepth ?? 0}px` },
    { label: 'Words loaded', value: `${words}` },
  ];

  useEffect(() => {
    themeShift.value = withSequence(
      withTiming(0.9, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
  }, [isDark, themeShift]);

  useEffect(() => {
    if (!session?.backendSessionId) {
      return;
    }

    let active = true;
    setAnalysisStatus('running');

    void analyzeSession(session.backendSessionId)
      .then((analysis) => {
        if (!active) {
          return;
        }

        setSession((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            conceptFriction: [
              { concept: 'Vocabulary load', score: Math.min(1, analysis.paragraphScores.wordComplexity || prev.conceptFriction[0]?.score || 0.2) },
              { concept: 'Inference depth', score: Math.min(1, analysis.paragraphScores.hesitation || prev.conceptFriction[1]?.score || 0.15) },
              { concept: 'Retention', score: Math.min(1, analysis.paragraphScores.pauseDuration || prev.conceptFriction[2]?.score || 0.12) },
            ],
          };
        });

        setAnalysisStatus('ready');
      })
      .catch(() => {
        if (active) {
          setAnalysisStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [session?.backendSessionId]);

  const themeShiftStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + themeShift.value * 0.12,
    transform: [{ scale: 0.99 + themeShift.value * 0.01 }],
  }));

  return (
    <Animated.ScrollView
      style={[styles.page, isDark ? styles.pageDark : null, themeShiftStyle]}
      contentContainerStyle={[styles.content, { paddingTop: 14 }]}>
      <Animated.Text entering={FadeInUp.duration(360)} style={[styles.title, isDark ? styles.titleDark : null]}>
        Learning Dashboard
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(360).delay(60)} style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
        Session telemetry, concept graph, and review signals
      </Animated.Text>
      <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
        Backend analysis: {analysisStatus}
      </Text>

      <View style={styles.grid}>
        {metrics.map((metric, index) => (
          <Animated.View
            key={metric.label}
            entering={FadeInDown.duration(320).delay(70 + index * 70)}
            layout={LinearTransition.duration(250)}
            style={[styles.metricCard, isDark ? styles.metricCardDark : null]}>
            <Text style={[styles.metricLabel, isDark ? styles.metricLabelDark : null]}>{metric.label}</Text>
            <Text style={[styles.metricValue, isDark ? styles.metricValueDark : null]}>{metric.value}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.duration(380).delay(190)} style={[styles.panel, isDark ? styles.panelDark : null]}>
        <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : null]}>Contextual concept graph</Text>
        {(session?.conceptFriction ?? []).map((node) => (
          <Animated.View
            key={node.concept}
            entering={FadeInDown.duration(280)}
            layout={LinearTransition.duration(220)}
            style={[styles.nodeRow, isDark ? styles.nodeRowDark : null]}>
            <View style={[styles.nodeDot, node.score > 0.6 ? styles.high : node.score > 0.35 ? styles.medium : styles.low]} />
            <Text style={[styles.nodeLabel, isDark ? styles.nodeLabelDark : null]}>{node.concept}</Text>
            <Text style={[styles.nodeValue, isDark ? styles.nodeValueDark : null]}>{Math.round(node.score * 100)}%</Text>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(380).delay(260)} style={[styles.panel, isDark ? styles.panelDark : null]}>
        <Text style={[styles.panelTitle, isDark ? styles.panelTitleDark : null]}>Review sheet</Text>
        <Text style={[styles.reviewLine, isDark ? styles.reviewLineDark : null]}>1. Revisit high-friction vocabulary in the latest chapter.</Text>
        <Text style={[styles.reviewLine, isDark ? styles.reviewLineDark : null]}>2. Re-read one dense section with simplification level 1.</Text>
        <Text style={[styles.reviewLine, isDark ? styles.reviewLineDark : null]}>3. Continue 10 minutes in focus mode and check improvement.</Text>
      </Animated.View>
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
    color: '#162642',
    fontSize: 28,
    fontWeight: '800',
  },
  titleDark: {
    color: '#E7F0FF',
  },
  subtitle: {
    color: '#61728B',
    fontSize: 13,
    marginTop: -2,
  },
  subtitleDark: {
    color: '#97A9C2',
  },
  grid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    borderRadius: 15,
    backgroundColor: '#292A45',
    padding: 12,
  },
  metricCardDark: {
    backgroundColor: '#23263B',
  },
  metricLabel: {
    color: '#61728B',
    fontSize: 12,
    fontWeight: '600',
  },
  metricLabelDark: {
    color: '#96A9C4',
  },
  metricValue: {
    marginTop: 6,
    color: '#F2F5FF',
    fontSize: 23,
    fontWeight: '800',
  },
  metricValueDark: {
    color: '#E4EEFF',
  },
  panel: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  panelDark: {
    backgroundColor: '#1A2431',
  },
  panelTitle: {
    color: '#162642',
    fontSize: 17,
    fontWeight: '800',
  },
  panelTitleDark: {
    color: '#E7F0FF',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F4F7FC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  nodeRowDark: {
    backgroundColor: '#243243',
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  high: {
    backgroundColor: '#D74A4A',
  },
  medium: {
    backgroundColor: '#DC9540',
  },
  low: {
    backgroundColor: '#44AA73',
  },
  nodeLabel: {
    flex: 1,
    color: '#213049',
    fontSize: 14,
    fontWeight: '600',
  },
  nodeLabelDark: {
    color: '#D4E2F7',
  },
  nodeValue: {
    color: '#4D5F79',
    fontSize: 12,
    fontWeight: '700',
  },
  nodeValueDark: {
    color: '#A8BCD8',
  },
  reviewLine: {
    color: '#2A3C58',
    lineHeight: 20,
    fontSize: 14,
  },
  reviewLineDark: {
    color: '#C0D0E6',
  },
});
