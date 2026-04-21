// src/screens/ReaderPage.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTelemetry } from '@/hooks/reader/useTelemetry';
import { useScrollVelocity } from '@/hooks/reader/useScrollVelocity';
import { useEyeStrain } from '@/hooks/reader/useEyeStrain';
import { useGloss } from '@/hooks/reader/useGloss';
import { useAutoTranslate } from '@/hooks/reader/useAutoTranslate';
import { useSimplifiedPhrases } from '@/hooks/reader/useSimplifiedPhrases';
import { saveSessionState, loadSessionState } from '@/engines/persistenceEngine';
import { ReadingSessionState } from '@/types/reader.types';
import { useFileStore } from '@/store/fileStore';
import Paragraph from '@/components/Reader/Paragraph';
import ZeroChromeLayer from '@/components/Reader/ZeroChromeLayer';
import ReviewModal from '@/components/Review/ReviewModal';
import {
  adaptReaderText,
  analyzeReaderSession,
  endReaderSession,
  fetchReaderFatigue,
  startReaderSession,
} from '@/lib/reader-api';
import { API_ROUTES } from '@/lib/api';

const BACKEND_BASE = 'https://enfinity-hackathon-backend.onrender.com';

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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [cognatesEnabled, setCognatesEnabled] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [peekMode, setPeekMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontFamily, setFontFamily] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('hindi'); // For Cognate Mapper

  // ── Simplified Phrases (inline user-triggered) ─────────────────────────
  const {
    isSimplifying,
    simplifyPhrase,
    addHighlightedPhrase,
    removeHighlight,
    getPhrasesForParagraph,
    getHighlightsForParagraph,
  } = useSimplifiedPhrases();

  // ── Session state ─────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restoredSession, setRestoredSession] = useState<ReadingSessionState | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [adaptedParagraphs, setAdaptedParagraphs] = useState<Record<number, string>>({});
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [fatigueLevel, setFatigueLevel] = useState<ReadingSessionState['fatigueLevel'] | null>(null);

  // ── Struggled paragraphs for review ──────────────────────────────────────
  const [struggledParagraphs, setStruggledParagraphs] = useState<
    Array<{ index: number; text: string; dwell_ms: number; rescroll_count: number }>
  >([]);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // ── Concept map state (incremental) ──────────────────────────────────────
  const conceptMapWords = useRef<Record<string, number[]>>({});
  const conceptMapCategories = useRef<Record<string, string[]>>({});
  const categorizedParagraphs = useRef(new Set<number>());

  const pendingAdaptations = useRef(new Set<number>());
  const pendingTranslations = useRef(new Set<number>());
  const restoredScrollRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(Date.now());
  const sessionEndedRef = useRef(false);
  
  // 🛑 ADDED: Track active paragraph and lock for height shifts/twitches
  const observerLockRef = useRef<NodeJS.Timeout | null>(null);
  const activeParagraphRef = useRef<number>(-1);

  const dwellMapRef = useRef<Record<number, number>>({});
  const rescrollMapRef = useRef<Record<number, number>>({});

  // ── Auth token for extension-backend ─────────────────────────────────────
  const [backendToken, setBackendToken] = useState<string | null>(null);
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('ar_token') : null;
    setBackendToken(t);
  }, []);

  const paragraphs = useMemo(() => file?.content.split('\n\n').filter(Boolean) || [], [file]);
  
  // ── Initialize hooks for translation and gloss early ────────────────────
  const { glossMap, onParagraphVisible: onGlossVisible, onParagraphHidden: onGlossHidden, glossedWordList } = useGloss();
  const { translatedParagraphs, onParagraphAdapted: onAutoTranslate, onParagraphVisible: onTranslateVisible, onParagraphHidden: onTranslateHidden, getTranslatedText } = useAutoTranslate(preferredLanguage, 5000);
  const { onParagraphEnter, onHesitation, onScroll, frictionMap, getSessionData, categorizedStruggles } = useTelemetry(fileId || '', sessionId);
  const { velocity, isScrolling, handleScroll } = useScrollVelocity();
  const { lineHeight, fontWeight, sepiaIntensity, level } = useEyeStrain(restoredSession?.sessionStartTime);

  const renderedParagraphs = useMemo(
    () => {
      const result = paragraphs.map((text, index) => {
        const adapted = adaptedParagraphs[index];
        // Use translated version if available, otherwise use adapted/original
        const rendered = adapted ? getTranslatedText(index, adapted) : text;
        if (adapted && adapted !== text) {
          console.log(`🎨 RENDERING PARA ${index}:`, {
            hasAdapted: true,
            originalLen: text.length,
            adaptedLen: adapted.length,
            hasTranslation: !!translatedParagraphs[index],
            firstWord: text.split(' ')[0],
            adaptedFirstWord: adapted.split(' ')[0],
          });
        }
        return rendered;
      });
      return result;
    },
    [adaptedParagraphs, paragraphs, translatedParagraphs, getTranslatedText],
  );

  // ── Categorize paragraph based on original text (using LLM) ──────────────
  const categorizeParagraphFromOriginal = useCallback(async (paraIndex: number) => {
    if (categorizedParagraphs.current.has(paraIndex)) return;

    const originalText = paragraphs[paraIndex];
    if (!originalText || originalText.trim().length === 0) return;

    // Immediately mark it as processed to handle concurrent calls while awaited
    categorizedParagraphs.current.add(paraIndex);

    console.log(`[Reader] Para ${paraIndex}: extracting hard words from original text...`);

    try {
      const extractRes = await fetch('/api/extract-hard-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText }),
      });

      if (!extractRes.ok) {
        return;
      }

      const extractData = await extractRes.json();
      const hardWords = extractData.hardWords || [];

      if (hardWords.length === 0) {
        return;
      }

      hardWords.forEach((word: string) => {
        if (!conceptMapWords.current[word]) conceptMapWords.current[word] = [];
        if (!conceptMapWords.current[word].includes(paraIndex)) {
          conceptMapWords.current[word].push(paraIndex);
        }
      });

      const categorizeRes = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: hardWords }),
      });

      if (categorizeRes.ok) {
        const categorizeData = await categorizeRes.json();
        if (categorizeData.categories) {
          Object.keys(categorizeData.categories).forEach((category) => {
            if (!conceptMapCategories.current[category]) conceptMapCategories.current[category] = [];
            categorizeData.categories[category].forEach((word: string) => {
              if (!conceptMapCategories.current[category].includes(word)) {
                conceptMapCategories.current[category].push(word);
              }
            });
          });
        }
      }

    } catch (err) {
      console.warn(`[Reader] Para ${paraIndex}: categorization failed`, err);
    }
  }, [paragraphs]);

  // ── Extract and categorize words from adapted paragraph ──────────────────
  const extractAndCategorizeWords = useCallback(async (adaptedHtml: string, paraIndex: number) => {
    // Skip if already categorized by the original-text path (same guard Set)
    if (categorizedParagraphs.current.has(paraIndex)) return;

    const pattern = /(\w+)\s*[\[\(]/g;
    const hardWords: string[] = [];
    let match;

    while ((match = pattern.exec(adaptedHtml)) !== null) {
      const word = match[1].toLowerCase();
      if (word && word.length > 3 && !hardWords.includes(word)) {
        hardWords.push(word);
        if (!conceptMapWords.current[word]) conceptMapWords.current[word] = [];
        if (!conceptMapWords.current[word].includes(paraIndex)) {
          conceptMapWords.current[word].push(paraIndex);
        }
      }
    }

    if (hardWords.length === 0) {
      categorizedParagraphs.current.add(paraIndex); // mark done even with no words
      return;
    }

    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: hardWords }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          Object.keys(data.categories).forEach((category) => {
            if (!conceptMapCategories.current[category]) conceptMapCategories.current[category] = [];
            data.categories[category].forEach((word: string) => {
              if (!conceptMapCategories.current[category].includes(word)) {
                conceptMapCategories.current[category].push(word);
              }
            });
          });
        }
      }
    } catch (err) {
      console.warn(`[Reader] Para ${paraIndex}: adapted categorization failed`, err);
    } finally {
      categorizedParagraphs.current.add(paraIndex); // mark done regardless of outcome
    }
  }, []);

  // ── Wrapper callbacks to handle gloss, translate, and categorization ──────
  const onParagraphVisible = useCallback((index: number, text: string) => {
    onGlossVisible(index, text);
    onTranslateVisible(index);
    void categorizeParagraphFromOriginal(index);
  }, [onGlossVisible, onTranslateVisible, categorizeParagraphFromOriginal]);

  const onParagraphHidden = useCallback((index: number) => {
    onGlossHidden(index);
    onTranslateHidden(index);
  }, [onGlossHidden, onTranslateHidden]);

  // ── Categorize initially visible paragraphs on mount ─────────────────────
  useEffect(() => {
    if (!storageReady || !file || paragraphs.length === 0) return;

    const timer = setTimeout(() => {
      const viewportHeight = window.innerHeight;
      paragraphs.forEach((_, index) => {
        const paraElement = document.querySelector(`[data-index="${index}"]`);
        if (paraElement) {
          const rect = paraElement.getBoundingClientRect();
          const isVisible = rect.top < viewportHeight && rect.bottom > 0;
          if (isVisible) {
            void categorizeParagraphFromOriginal(index);
          }
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [storageReady, file, paragraphs, categorizeParagraphFromOriginal]);

  // ── Keyboard: Escape = peek mode ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPeekMode(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Dark mode body class ──────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ── Restore session ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!fileId) return;

    const saved = loadSessionState(fileId);
    setRestoredSession(saved);
    
    // 🛑 FORCE a new session creation every time the page loads.
    setSessionId(null); 
    
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

  // ── Start session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!storageReady || !file || !user?.id || sessionId) return;
    let cancelled = false;

    const bootstrap = async () => {
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
        const next = createPersistedState({
          fileId, sessionId: started.sessionId,
          scrollDepth: restoredSession?.scrollDepth ?? 0,
          sessionStartTime: restoredSession?.sessionStartTime ?? openedAtRef.current,
          adaptedParagraphs: restoredSession?.adaptedParagraphs ?? {},
          eyeStrainLevel: restoredSession?.eyeStrainLevel ?? 0,
          existing: restoredSession, analysis, fatigueLevel,
        });
        setRestoredSession(next);
        saveSessionState(next);
      } catch {
        const localId = `local:${crypto.randomUUID()}`;
        setSessionId(localId);
        const next = createPersistedState({
          fileId, sessionId: localId,
          scrollDepth: restoredSession?.scrollDepth ?? 0,
          sessionStartTime: restoredSession?.sessionStartTime ?? openedAtRef.current,
          adaptedParagraphs: restoredSession?.adaptedParagraphs ?? {},
          eyeStrainLevel: restoredSession?.eyeStrainLevel ?? 0,
          existing: restoredSession, analysis, fatigueLevel,
        });
        setRestoredSession(next);
        saveSessionState(next);
      }
    };

    void bootstrap();
    return () => { cancelled = true; };
  }, [analysis, fatigueLevel, file, fileId, restoredSession, sessionId, storageReady, user?.id]);

  // ── Scroll handler ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fileId) return;
    const handler = () => {
      handleScroll();
      onScroll(velocity);
      const depth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
      const next = createPersistedState({
        fileId, sessionId, scrollDepth: depth,
        sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
        adaptedParagraphs, eyeStrainLevel: level,
        existing: restoredSession, analysis, fatigueLevel,
      });
      setRestoredSession(next);
      saveSessionState(next);
      updateFile(fileId, { scrollDepth: depth });
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [adaptedParagraphs, analysis, fatigueLevel, fileId, handleScroll, level, onScroll, restoredSession, sessionId, updateFile, velocity]);

  // ── AI Adaptation Engine Trigger ───────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !file) return;

    // Use our native telemetry engine data to decide what to adapt
    const targetIndex = paragraphs.findIndex((text, index) => {
      if (adaptedParagraphs[index]) return false;
      if (pendingAdaptations.current.has(index)) return false;
      if (text.trim().length === 0) return false;

      const isStruggling = 
        categorizedStruggles.longStalls.includes(index) || 
        categorizedStruggles.shortPauses.includes(index);

      return isStruggling;
    });

    if (targetIndex < 0) return;
    
    console.log(`🎯 Found struggling paragraph ${targetIndex}`, {
      isLongStall: categorizedStruggles.longStalls.includes(targetIndex),
      isShortPause: categorizedStruggles.shortPauses.includes(targetIndex),
    });
    
    pendingAdaptations.current.add(targetIndex);

    const run = async () => {
      try {
        let adapted = '';
        
        // 1. Determine how badly they are struggling based on telemetry
        const isLongStall = categorizedStruggles.longStalls.includes(targetIndex);
        const frictionType = isLongStall ? 'LONG_PAUSE' : 'SHORT_PAUSE';

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (backendToken) headers['Authorization'] = `Bearer ${backendToken}`;

        try {
          const res = await fetch(`${BACKEND_BASE}/api/adapt`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              paragraph: paragraphs[targetIndex],
              paragraph_index: targetIndex,
              url: window.location.href,
              dwell_ms: dwellMapRef.current[targetIndex] || (isLongStall ? 25000 : 5000), 
              rescroll_count: rescrollMapRef.current[targetIndex] || 0,
              session_elapsed_min: (Date.now() - (restoredSession?.sessionStartTime ?? Date.now())) / 60000,
              language: null,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            adapted = data.adapted_html || '';
          }
        } catch (e) {
          console.log("External backend failed, falling back to local API.");
        }

        if (!adapted) {
          const result = await adaptReaderText({ 
            text: paragraphs[targetIndex], 
            strugglingParagraphs: [0], 
            userId: user?.id, 
            frictionType: frictionType
          });
          
          adapted = result.modifiedText;
          console.log("🧠 AWS Bedrock Returned:", adapted);
        }

        // 🛑 FIX 1: Trigger auto-translate OUTSIDE the state setter!
        // Hook will automatically translate after 5 seconds of dwell time
        onAutoTranslate(targetIndex, adapted);

        setAdaptedParagraphs(current => {
          const next = { ...current, [targetIndex]: adapted };
          
          const nextState = createPersistedState({
            fileId, sessionId, scrollDepth: restoredSession?.scrollDepth ?? 0,
            sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
            adaptedParagraphs: next, eyeStrainLevel: level,
            existing: restoredSession, analysis, fatigueLevel,
          });
          setRestoredSession(nextState);
          saveSessionState(nextState);
          return next;
        });

        // Extract and categorize words from adapted paragraph for the concept graph
        extractAndCategorizeWords(adapted, targetIndex);

        // Track struggled paragraph for review
        setStruggledParagraphs(prev => {
          if (prev.find(p => p.index === targetIndex)) return prev;
          return [...prev, {
            index: targetIndex,
            text: paragraphs[targetIndex],
            dwell_ms: dwellMapRef.current[targetIndex] || (isLongStall ? 25000 : 5000),
            rescroll_count: rescrollMapRef.current[targetIndex] || 0,
          }];
        });

      } catch (err) {
        console.error('Adaptation failed:', err);
      } finally {
        pendingAdaptations.current.delete(targetIndex);
      }
    };

    void run();
  }, [adaptedParagraphs, analysis, backendToken, categorizedStruggles, extractAndCategorizeWords, fatigueLevel, file, fileId, frictionMap, level, paragraphs, restoredSession, sessionId, user?.id, onAutoTranslate]);

  // ── Persist eye-strain level ──────────────────────────────────────────────
  useEffect(() => {
    if (!storageReady || !fileId) return;
    const next = createPersistedState({
      fileId, sessionId, scrollDepth: restoredSession?.scrollDepth ?? 0,
      sessionStartTime: restoredSession?.sessionStartTime ?? Date.now(),
      adaptedParagraphs, eyeStrainLevel: level,
      existing: restoredSession, analysis, fatigueLevel,
    });
    saveSessionState(next);
  }, [adaptedParagraphs, analysis, fatigueLevel, fileId, level, restoredSession, sessionId, storageReady]);

  const progress = restoredSession?.scrollDepth ?? 0;

  const markSessionEndedLocally = useCallback((endedAt: number) => {
    setRestoredSession(current => {
      if (!current) return current;
      const next: ReadingSessionState = { ...current, sessionEndTime: endedAt, elapsedMs: Math.max(0, endedAt - current.sessionStartTime) };
      saveSessionState(next);
      return next;
    });
  }, []);

  const finishSession = useCallback(async (options?: { goToDashboard?: boolean }) => {
    // Prevent multiple simultaneous calls but allow retry if modal isn't showing
    if (sessionEndedRef.current && showReview) {
      if (options?.goToDashboard) router.push('/dashboard');
      return;
    }
    
    // Prevent duplicate clicks while processing
    if (isEndingSession) {
      return;
    }
    
    setIsEndingSession(true);
    
    // Set flag to prevent duplicate calls
    sessionEndedRef.current = true;
    markSessionEndedLocally(Date.now());
    const sessionData = getSessionData();

    if (!sessionId || sessionId.startsWith('local:')) {
      setShowReview(true);
      setIsEndingSession(false);
      if (options?.goToDashboard) router.push('/dashboard');
      return;
    }

    try {
      const [analysisResult, fatigueResult] = await Promise.allSettled([
        analyzeReaderSession(sessionId),
        fetchReaderFatigue(sessionId),
      ]);

      if (analysisResult.status === 'fulfilled') {
        const normalizedScores = Object.fromEntries(
          Object.entries(analysisResult.value.paragraphScores).map(([k, v]) => [Number(k), v]),
        );
        const nextAnalysis: SessionAnalysis = {
          paragraphScores: normalizedScores,
          strugglingParagraphs: analysisResult.value.strugglingParagraphs,
        };
        setAnalysis(nextAnalysis);
        setRestoredSession(current => {
          if (!current) return current;
          const next = { ...current, analysis: nextAnalysis };
          saveSessionState(next);
          return next;
        });
      }

      if (fatigueResult.status === 'fulfilled') {
        const nextFatigue = fatigueResult.value.level as ReadingSessionState['fatigueLevel'];
        setFatigueLevel(nextFatigue);
        setRestoredSession(current => {
          if (!current) return current;
          const next = { ...current, fatigueLevel: nextFatigue };
          saveSessionState(next);
          return next;
        });
      }

      await endReaderSession(sessionId);
    } catch (err) {
      console.error('Failed to finish session:', err);
      // Reset flag on error so user can retry
      sessionEndedRef.current = false;
    } finally {
      void sessionData;
      setShowReview(true);
      setIsEndingSession(false);
      if (options?.goToDashboard) router.push('/dashboard');
    }
  }, [getSessionData, markSessionEndedLocally, router, sessionId, showReview, isEndingSession]);

  useEffect(() => {
    const handlePageHide = () => {
      if (sessionEndedRef.current || !sessionId || sessionId.startsWith('local:')) return;
      markSessionEndedLocally(Date.now());
      if (typeof navigator?.sendBeacon === 'function') {
        const sent = navigator.sendBeacon(API_ROUTES.sessionEnd, new Blob([JSON.stringify({ sessionId })], { type: 'application/json' }));
        if (sent) { sessionEndedRef.current = true; return; }
      }
      sessionEndedRef.current = true;
      void endReaderSession(sessionId).catch(() => { sessionEndedRef.current = false; });
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      handlePageHide();
    };
  }, [markSessionEndedLocally, sessionId]);

  // Guard: redirect if no file (client-side only)
  useEffect(() => {
    if (!file) {
      router.push('/dashboard');
    }
  }, [file, router]);

  if (!file) return null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen transition-colors duration-1000"
      style={{
        backgroundColor: darkMode
          ? '#121212'
          : sepiaIntensity > 0
            ? `hsl(36, 40%, ${95 - sepiaIntensity * 10}%)`
            : undefined,
        color: darkMode ? '#e0e0e0' : undefined,
        fontFamily: fontFamily || undefined,
      }}
    >
      <ZeroChromeLayer
        fileName={file.name}
        progress={progress}
        sessionStartTime={restoredSession?.sessionStartTime}
        onBack={() => void finishSession({ goToDashboard: true })}
        onToggleCognates={() => setCognatesEnabled(c => !c)}
        onEndSession={() => void finishSession()}
        cognatesEnabled={cognatesEnabled}
        isScrolling={isScrolling}
        darkMode={darkMode}
        fontFamily={fontFamily}
        onDarkModeChange={setDarkMode}
        onFontChange={setFontFamily}
        peekMode={peekMode}
        onEnterPeek={() => setPeekMode(true)}
        onResumePeek={() => setPeekMode(false)}
        isEndingSession={isEndingSession}
      />

      {/* Reader content — hidden in peek mode */}
      <div
        className="pt-20 pb-40 transition-opacity duration-300"
        style={{ opacity: peekMode ? 0 : 1, pointerEvents: peekMode ? 'none' : undefined }}
      >
        {renderedParagraphs.map((text, index) => (
          <Paragraph
            key={index}
            text={text}
            index={index}
            isAdapted={!!adaptedParagraphs[index] || !!translatedParagraphs[index]}
            frictionScore={frictionMap.get(index) || 0}
            onEnter={(idx, count) => {
              if (observerLockRef.current) return;
              activeParagraphRef.current = idx;
              onParagraphEnter(idx, count);
              observerLockRef.current = setTimeout(() => {
                observerLockRef.current = null;
              }, 500);
            }}
            onHesitation={onHesitation}
            onVisible={onParagraphVisible}
            onHidden={onParagraphHidden}
            showCognates={cognatesEnabled}
            lineHeight={lineHeight}
            fontWeight={fontWeight}
            fontFamily={fontFamily}
            gloss={glossMap.get(index)}
            // ── Phrase simplification & highlight ──────────────────────
            isSimplifying={isSimplifying}
            simplifiedPhrases={getPhrasesForParagraph(index)}
            highlightedPhrases={getHighlightsForParagraph(index)}
            onSimplifyRequest={async ({ phrase, paragraphText, startOffset, endOffset }) => {
              await simplifyPhrase({
                paragraphIndex: index,
                phrase,
                paragraphText,
                startOffset,
                endOffset,
              });
            }}
            onHighlightRequest={({ phrase, startOffset, endOffset }) => {
              addHighlightedPhrase({
                id: crypto.randomUUID(),
                paragraphIndex: index,
                phrase,
                startOffset,
                endOffset,
                timestamp: Date.now(),
              });
            }}
            onUnhighlightRequest={(id) => removeHighlight(id)}
          />
        ))}
      </div>

      {/* Review modal */}
      <ReviewModal
        open={showReview}
        onClose={() => setShowReview(false)}
        onDestroyReader={() => { setShowReview(false); router.push('/dashboard'); }}
        sessionId={sessionId || ''}
        struggledParagraphs={struggledParagraphs}
        language={null}
        backendBase={BACKEND_BASE}
        token={backendToken}
        glossedWords={glossedWordList}
        fileName={file.name}
        conceptMapCategories={conceptMapCategories.current}
        conceptMapWords={conceptMapWords.current}
      />

      {/* DEBUG BUTTON - Remove in production */}
      <button
        onClick={() => {
          console.log('🔍 DEBUG STATE:', {
            activeParagraph: activeParagraphRef.current,
            adaptedParagraphsCount: Object.keys(adaptedParagraphs).length,
            adaptedParagraphs,
            pendingCount: pendingAdaptations.current.size,
            longStalls: categorizedStruggles.longStalls,
            shortPauses: categorizedStruggles.shortPauses,
          });
        }}
        className="fixed bottom-4 left-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium z-40"
      >
        🐛 Show State
      </button>
    </div>
  );
}