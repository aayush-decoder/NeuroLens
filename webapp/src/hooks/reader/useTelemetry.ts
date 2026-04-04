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

export function useTelemetry(fileId: string, sessionId?: string | null) {
  const stateRef = useRef<TelemetryState>(createTelemetryState());
  const [struggledTerms, setStruggledTerms] = useState<StruggledTerm[]>([]);
  const [frictionMap, setFrictionMap] = useState<Map<number, number>>(new Map());
  const lastScrollTelemetryAt = useRef(0);
  const sessionIdRef = useRef<string | null>(sessionId ?? null);

  useEffect(() => {
    sessionIdRef.current = sessionId ?? null;
  }, [sessionId]);

  const persistState = useCallback(() => {
    if (!fileId) return;
    saveTelemetrySnapshot(fileId, serializeTelemetryState(stateRef.current));
  }, [fileId]);

  const emitTelemetry = useCallback(async (type: string, value: number, meta?: Record<string, unknown>) => {
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
      // Backend is best-effort; local telemetry continues even if network fails.
    }
  }, []);

  useEffect(() => {
    if (!fileId) return;

    const snapshot = loadTelemetrySnapshot(fileId) as TelemetrySnapshot | null;
    if (snapshot) {
      stateRef.current = hydrateTelemetryState(snapshot);
      setFrictionMap(new Map(snapshot.paragraphs.map((paragraph) => [paragraph.paragraphIndex, paragraph.frictionScore])));
      setStruggledTerms(snapshot.struggledTerms);
    }
  }, [fileId]);

  const updateFrictionMap = useCallback(() => {
    const map = new Map<number, number>();
    stateRef.current.paragraphs.forEach((p, idx) => {
      map.set(idx, p.frictionScore);
    });
    setFrictionMap(new Map(map));
    setStruggledTerms(getStruggledTerms(stateRef.current));
  }, []);

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
    // Finalize current paragraph
    if (stateRef.current.currentParagraph >= 0) {
      stateRef.current = enterParagraph(stateRef.current, -1);
    }
    persistState();
    return {
      paragraphs: Array.from(stateRef.current.paragraphs.values()),
      struggledTerms: getStruggledTerms(stateRef.current),
    };
  }, [persistState]);

  // Periodically update friction map
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
  };
}
