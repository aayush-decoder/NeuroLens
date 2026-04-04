import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { countWords, loadDocuments, loadSession, type ReaderDocument, type ReaderSession } from '@/lib/adaptive-store';

export default function DashboardScreen() {
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [docs, setDocs] = useState<ReaderDocument[]>([]);

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

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learning Dashboard</Text>
      <Text style={styles.subtitle}>Session telemetry, concept graph, and review signals</Text>

      <View style={styles.grid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Contextual concept graph</Text>
        {(session?.conceptFriction ?? []).map((node) => (
          <View key={node.concept} style={styles.nodeRow}>
            <View style={[styles.nodeDot, node.score > 0.6 ? styles.high : node.score > 0.35 ? styles.medium : styles.low]} />
            <Text style={styles.nodeLabel}>{node.concept}</Text>
            <Text style={styles.nodeValue}>{Math.round(node.score * 100)}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Review sheet</Text>
        <Text style={styles.reviewLine}>1. Revisit high-friction vocabulary in the latest chapter.</Text>
        <Text style={styles.reviewLine}>2. Re-read one dense section with simplification level 1.</Text>
        <Text style={styles.reviewLine}>3. Continue 10 minutes in focus mode and check improvement.</Text>
      </View>
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
    color: '#162642',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#61728B',
    fontSize: 13,
    marginTop: -2,
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
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  metricLabel: {
    color: '#61728B',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    marginTop: 6,
    color: '#11203A',
    fontSize: 23,
    fontWeight: '800',
  },
  panel: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  panelTitle: {
    color: '#162642',
    fontSize: 17,
    fontWeight: '800',
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
  nodeValue: {
    color: '#4D5F79',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewLine: {
    color: '#2A3C58',
    lineHeight: 20,
    fontSize: 14,
  },
});
