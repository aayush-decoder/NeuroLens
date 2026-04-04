import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTelemetryState,
  enterParagraph,
  recordHesitation,
  recordScrollVelocity,
  getStruggledTerms,
  TelemetryState,
  TelemetrySnapshot,
  hydrateTelemetryState,
  serializeTelemetryState,
} from '@/engines/telemetryEngine';
import { loadTelemetrySnapshot, saveTelemetrySnapshot } from '@/engines/persistenceEngine';
import { StruggledTerm } from '@/types/reader.types';
import { sendReaderTelemetry } from '@/lib/reader-api';
import { detectFrictionWithPoints, getCategorizedStruggles } from '@/lib/friction'; // Added friction logic

export function useTelemetry(fileId: string, sessionId?: string | null) {
  const stateRef = useRef<TelemetryState>(createTelemetryState());
  const [struggledTerms, setStruggledTerms] = useState<StruggledTerm[]>([]);
  const [frictionMap, setFrictionMap] = useState<Map<number, number>>(new Map());
  const lastScrollTelemetryAt = useRef(0);
  const sessionIdRef = useRef<string | null>(sessionId ?? null);
  
  // Track events for categorization
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    sessionIdRef.current = sessionId ?? null;
  }, [sessionId]);

  const persistState = useCallback(() => {
    if (!fileId) return;
    saveTelemetrySnapshot(fileId, serializeTelemetryState(stateRef.current));
  }, [fileId]);

  const emitTelemetry = useCallback(async (type: string, value: number, meta?: Record<string, unknown>) => {
    // Add event to local list for friction categorization
    setEvents(prev => [...prev, { type, value, meta, timestamp: Date.now() }]);

    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId || activeSessionId.startsWith('local:')) return;

    try {
      await sendReaderTelemetry({
        sessionId: activeSessionId,
        type,
        value,
        meta,
      });
    } catch {
      // Backend is best-effort
    }
  }, []);

  const updateFrictionMap = useCallback(() => {
    const map = new Map<number, number>();
    stateRef.current.paragraphs.forEach((p, idx) => {
      map.set(idx, p.frictionScore);
    });
    setFrictionMap(new Map(map));
    setStruggledTerms(getStruggledTerms(stateRef.current));

    // Analyze events for the Cognate Mapper
    const scores = detectFrictionWithPoints(events);
    const struggles = getCategorizedStruggles(scores);
    
    // You can expose these struggles or trigger an adaptation callback here
    return struggles;
  }, [events]);

  const onParagraphEnter = useCallback((index: number) => {
    const previousParagraph = stateRef.current.currentParagraph;
    const dwellMs = previousParagraph >= 0 ? Date.now() - stateRef.current.paragraphEntryTime : 0;

    stateRef.current = enterParagraph(stateRef.current, index);
    persistState();
    updateFrictionMap();

    if (previousParagraph >= 0 && dwellMs > 0) {
      void emitTelemetry('pause', dwellMs / 1000, { paragraph: previousParagraph });
    }
  }, [emitTelemetry, persistState, updateFrictionMap]);

  const onHesitation = useCallback((paragraphIndex: number, word: string) => {
    stateRef.current = recordHesitation(stateRef.current, paragraphIndex, word);
    persistState();
    updateFrictionMap();
    // Highlights trigger short-pause style English descriptions
    void emitTelemetry('highlight', 1, { paragraph: paragraphIndex, word });
  }, [emitTelemetry, persistState, updateFrictionMap]);

  const onScroll = useCallback((velocity: number) => {
    stateRef.current = recordScrollVelocity(stateRef.current, velocity);
    persistState();

    if (stateRef.current.currentParagraph >= 0) {
      const now = Date.now();
      if (now - lastScrollTelemetryAt.current > 900) {
        lastScrollTelemetryAt.current = now;
        void emitTelemetry('scroll', velocity, { paragraph: stateRef.current.currentParagraph });
      }
    }
  }, [emitTelemetry, persistState]);

  const getSessionData = useCallback(() => {
    if (stateRef.current.currentParagraph >= 0) {
      stateRef.current = enterParagraph(stateRef.current, -1);
    }
    persistState();
    const scores = detectFrictionWithPoints(events);
    return {
      paragraphs: Array.from(stateRef.current.paragraphs.values()),
      struggledTerms: getStruggledTerms(stateRef.current),
      categorizedStruggles: getCategorizedStruggles(scores) // Return categorized struggles
    };
  }, [persistState, events]);

  // Periodic persistence and map updates
  useEffect(() => {
    const interval = setInterval(updateFrictionMap, 3000);
    return () => clearInterval(interval);
  }, [updateFrictionMap]);

  useEffect(() => {
    const interval = setInterval(persistState, 5000);
    return () => clearInterval(interval);
  }, [persistState]);

  return {
    onParagraphEnter,
    onHesitation,
    onScroll,
    frictionMap,
    struggledTerms,
    getSessionData,
    categorizedStruggles: getCategorizedStruggles(detectFrictionWithPoints(events)) // Expose for the UI
  };
}