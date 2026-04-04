import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTelemetry } from '@/hooks/reader/useTelemetry';
import { useScrollVelocity } from '@/hooks/reader/useScrollVelocity';
import { useEyeStrain } from '@/hooks/reader/useEyeStrain';
import { saveSessionState, loadSessionState } from '@/engines/persistenceEngine';
import { ReadingSessionState } from '@/types/reader.types';
import { useFileStore } from '@/store/fileStore';
import Paragraph from '@/components/Reader/Paragraph';
import ZeroChromeLayer from '@/components/Reader/ZeroChromeLayer';
import ConceptGraph from '@/components/Review/ConceptGraph';
import {
  adaptReaderText,
  analyzeReaderSession,
  endReaderSession,
  fetchReaderFatigue,
  startReaderSession,
} from '@/lib/reader-api';
import { API_ROUTES } from '@/lib/api';

interface ReaderPageProps {
  fileId: string;
}

type SessionAnalysis = NonNullable<ReadingSessionState['analysis']>;

type PersistedStateInput = {
  fileId: string;
  sessionId: string | null;
  scrollDepth: number;
  sessionStartTime: number;
  sessionEndTime?: number | null;
  adaptedParagraphs: Record<number, string>;
  eyeStrainLevel: number;
  existing?: ReadingSessionState | null;
  analysis?: SessionAnalysis | null;
  fatigueLevel?: ReadingSessionState['fatigueLevel'] | null;
};

function createPersistedState(input: PersistedStateInput): ReadingSessionState {
  return {
    fileId: input.fileId,
    sessionId: input.sessionId,
    scrollDepth: input.scrollDepth,
    sessionStartTime: input.sessionStartTime,
    sessionEndTime: input.sessionEndTime ?? input.existing?.sessionEndTime,
    elapsedMs: Date.now() - input.sessionStartTime,
    adaptations: input.existing?.adaptations ?? [],
    adaptedParagraphs: input.adaptedParagraphs,
    eyeStrainLevel: input.eyeStrainLevel,
    analysis: input.analysis ?? input.existing?.analysis,
    fatigueLevel: input.fatigueLevel ?? input.existing?.fatigueLevel,
  };
}

export default function ReaderPage({ fileId }: ReaderPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const file = useFileStore((state) => state.files.find((entry) => entry.id === fileId));
  const updateFile = useFileStore((state) => state.updateFile);

  const [cognatesEnabled, setCognatesEnabled] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restoredSession, setRestoredSession] = useState<ReadingSessionState | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [adaptedParagraphs, setAdaptedParagraphs] = useState<Record<number, string>>({});
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [fatigueLevel, setFatigueLevel] = useState<ReadingSessionState['fatigueLevel'] | null>(null);

  const pendingAdaptations = useRef(new Set<number>());
  const restoredScrollRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(Date.now());
  const sessionEndedRef = useRef(false);

  const paragraphs = useMemo(() => file?.content.split('\n\n').filter(Boolean) || [], [file]);
  const renderedParagraphs = useMemo(
    () => paragraphs.map((text, index) => adaptedParagraphs[index] || text),
    [adaptedParagraphs, paragraphs],
  );

  const { onParagraphEnter, onHesitation, onScroll, frictionMap, getSessionData } = useTelemetry(fileId || '', sessionId);
  const { velocity, isScrolling, handleScroll } = useScrollVelocity();
  const { lineHeight, fontWeight, sepiaIntensity, level } = useEyeStrain(restoredSession?.sessionStartTime);

  useEffect(() => {
    if (!fileId) return;

    const saved = loadSessionState(fileId);
    setRestoredSession(saved);
    setSessionId(saved?.sessionId ?? null);
    setAdaptedParagraphs(saved?.adaptedParagraphs ?? {});
    setAnalysis(saved?.analysis ?? null);
    setFatigueLevel(saved?.fatigueLevel ?? null);
    setStorageReady(true);
  }, [fileId]);

  useEffect(() => {
    if (!storageReady || restoredScrollRef.current) return;
    if (typeof restoredSession?.scrollDepth !== 'number') return;

    restoredScrollRef.current = true;
    requestAnimationFrame(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
      window.scrollTo(0, restoredSession.scrollDepth * maxScroll);
    });
  }, [restoredSession?.scrollDepth, storageReady]);

  useEffect(() => {
    if (!storageReady || !file || !user?.id || sessionId) return;

    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const started = await startReaderSession({
          userId: user.id,
          contentId: file.id,
          title: file.name,
          body: file.content,
          startedAt: new Date(openedAtRef.current).toISOString(),
        });

        if (cancelled) return;

        setSessionId(started.sessionId);
        const nextState = createPersistedState({
          fileId,
          sessionId: started.sessionId,
          scrollDepth: restoredSession?.scrollDepth ?? 0,
          sessionStartTime: restoredSession?.sessionStartTime ?? openedAtRef.current,
          adaptedParagraphs: restoredSession?.adaptedParagraphs ?? {},
          eyeStrainLevel: restoredSession?.eyeStrainLevel ?? 0,
          existing: restoredSession,
          analysis,
          fatigueLevel,
        });
        setRestoredSession(nextState);
        saveSessionState(nextState);
      } catch (error) {
        console.error('Failed to start reader session:', error);
        const localSessionId = `local:${crypto.randomUUID()}`;
        setSessionId(localSessionId);

        const nextState = createPersistedState({
          fileId,
          sessionId: localSessionId,
          scrollDepth: restoredSession?.scrollDepth ?? 0,
          sessionStartTime: restoredSession?.sessionStartTime ?? openedAtRef.current,
          adaptedParagraphs: restoredSession?.adaptedParagraphs ?? {},
          eyeStrainLevel: restoredSession?.eyeStrainLevel ?? 0,
          existing: restoredSession,
          analysis,
          fatigueLevel,
        });

        setRestoredSession(nextState);
        saveSessionState(nextState);
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [analysis, fatigueLevel, file, fileId, restoredSession, sessionId, storageReady, user?.id]);

  useEffect(() => {
    if (!fileId) return;

    const onScrollHandler = () => {
      handleScroll();
      onScroll(velocity);

      const depth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      const nextState = createPersistedState({
        fileId,
        sessionId,
        scrollDepth: depth,
        sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
        adaptedParagraphs,
        eyeStrainLevel: level,
        existing: restoredSession,
        analysis,
        fatigueLevel,
      });

      setRestoredSession(nextState);
      saveSessionState(nextState);
      updateFile(fileId, { scrollDepth: depth });
    };

    window.addEventListener('scroll', onScrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', onScrollHandler);
  }, [adaptedParagraphs, analysis, fatigueLevel, fileId, handleScroll, level, onScroll, restoredSession, sessionId, updateFile, velocity]);


  useEffect(() => {
    if (!sessionId || !file) return;

    const targetIndex = paragraphs.findIndex((text, index) => {
      if (adaptedParagraphs[index]) return false;
      return (frictionMap.get(index) ?? 0) >= 0.65 && text.trim().length > 0 && !pendingAdaptations.current.has(index);
    });

    if (targetIndex < 0) return;

    pendingAdaptations.current.add(targetIndex);

    const runAdaptation = async () => {
      try {
        const result = await adaptReaderText({
          text: paragraphs[targetIndex],
          strugglingParagraphs: [targetIndex],
        });

        setAdaptedParagraphs((current) => {
          const next = { ...current, [targetIndex]: result.modifiedText };
          const nextState = createPersistedState({
            fileId,
            sessionId,
            scrollDepth: restoredSession?.scrollDepth ?? 0,
            sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
            adaptedParagraphs: next,
            eyeStrainLevel: level,
            existing: restoredSession,
            analysis,
            fatigueLevel,
          });
          setRestoredSession(nextState);
          saveSessionState(nextState);
          return next;
        });
      } catch (error) {
        console.error('Paragraph adaptation failed:', error);
      } finally {
        pendingAdaptations.current.delete(targetIndex);
      }
    };

    void runAdaptation();
  }, [adaptedParagraphs, analysis, fatigueLevel, file, fileId, frictionMap, level, paragraphs, restoredSession, sessionId]);

  useEffect(() => {
    if (!storageReady || !fileId) return;

    const nextState = createPersistedState({
      fileId,
      sessionId,
      scrollDepth: restoredSession?.scrollDepth ?? 0,
      sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
      adaptedParagraphs,
      eyeStrainLevel: level,
      existing: restoredSession,
      analysis,
      fatigueLevel,
    });

    saveSessionState(nextState);
  }, [adaptedParagraphs, analysis, fatigueLevel, fileId, level, restoredSession, sessionId, storageReady]);

  const progress = restoredSession?.scrollDepth ?? 0;

  const markSessionEndedLocally = useCallback((endedAt: number) => {
    setRestoredSession((current) => {
      if (!current) return current;

      const next: ReadingSessionState = {
        ...current,
        sessionEndTime: endedAt,
        elapsedMs: Math.max(0, endedAt - current.sessionStartTime),
      };

      saveSessionState(next);
      return next;
    });
  }, []);

  const finishSession = useCallback(async (options?: { goToDashboard?: boolean }) => {
    if (sessionEndedRef.current) {
      if (options?.goToDashboard) {
        router.push('/dashboard');
      }
      return;
    }

    sessionEndedRef.current = true;
    markSessionEndedLocally(Date.now());

    const sessionData = getSessionData();

    if (!sessionId || sessionId.startsWith('local:')) {
      setShowReview(true);
      void sessionData;
      if (options?.goToDashboard) {
        router.push('/dashboard');
      }
      return;
    }

    try {
      const [analysisResult, fatigueResult] = await Promise.allSettled([
        analyzeReaderSession(sessionId),
        fetchReaderFatigue(sessionId),
      ]);

      if (analysisResult.status === 'fulfilled') {
        const normalizedScores = Object.fromEntries(
          Object.entries(analysisResult.value.paragraphScores).map(([key, value]) => [Number(key), value]),
        );

        const nextAnalysis: SessionAnalysis = {
          paragraphScores: normalizedScores,
          strugglingParagraphs: analysisResult.value.strugglingParagraphs,
        };

        setAnalysis(nextAnalysis);
        setRestoredSession((current) => {
          if (!current) return current;
          const next = { ...current, analysis: nextAnalysis };
          saveSessionState(next);
          return next;
        });
      }

      if (fatigueResult.status === 'fulfilled') {
        const nextFatigue = fatigueResult.value.level as ReadingSessionState['fatigueLevel'];
        setFatigueLevel(nextFatigue);
        setRestoredSession((current) => {
          if (!current) return current;
          const next = { ...current, fatigueLevel: nextFatigue };
          saveSessionState(next);
          return next;
        });
      }

      await endReaderSession(sessionId);
    } catch (error) {
      console.error('Failed to finish session:', error);
    } finally {
      void sessionData;
      setShowReview(true);
      if (options?.goToDashboard) {
        router.push('/dashboard');
      }
    }
  }, [getSessionData, router, sessionId]);

  const handleEndSession = useCallback(() => {
    void finishSession();
  }, [finishSession]);

  const handleBackToDashboard = useCallback(() => {
    void finishSession({ goToDashboard: true });
  }, [finishSession]);

  useEffect(() => {
    const handlePageHide = () => {
      if (sessionEndedRef.current) return;
      if (!sessionId || sessionId.startsWith('local:')) return;

      const endedAt = Date.now();
      markSessionEndedLocally(endedAt);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const beaconBody = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
        const sent = navigator.sendBeacon(API_ROUTES.sessionEnd, beaconBody);
        if (sent) {
          sessionEndedRef.current = true;
          return;
        }
      }

      sessionEndedRef.current = true;
      void endReaderSession(sessionId).catch((error) => {
        console.error('Failed to end session during page hide:', error);
        sessionEndedRef.current = false;
      });
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      handlePageHide();
    };
  }, [markSessionEndedLocally, sessionId]);

  if (!file) {
    router.push('/dashboard');
    return null;
  }

  if (showReview) {
    const sessionData = getSessionData();
    return (
      <ConceptGraph
        terms={sessionData.struggledTerms}
        paragraphs={sessionData.paragraphs}
        fileName={file.name}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen transition-colors duration-1000"
      style={{
        backgroundColor: sepiaIntensity > 0
          ? `hsl(36, 40%, ${95 - sepiaIntensity * 10}%)`
          : undefined,
      }}
    >
      <ZeroChromeLayer
        fileName={file.name}
        progress={progress}
        onBack={handleBackToDashboard}
        onToggleCognates={() => setCognatesEnabled(!cognatesEnabled)}
        onEndSession={handleEndSession}
        cognatesEnabled={cognatesEnabled}
        isScrolling={isScrolling}
      />

      <div className="pt-20 pb-40">
        {renderedParagraphs.map((text, index) => (
          <Paragraph
            key={index}
            text={text}
            index={index}
            frictionScore={frictionMap.get(index) || 0}
            onEnter={onParagraphEnter}
            onHesitation={onHesitation}
            showCognates={cognatesEnabled}
            lineHeight={lineHeight}
            fontWeight={fontWeight}
          />
        ))}
      </div>
    </div>
  );
}