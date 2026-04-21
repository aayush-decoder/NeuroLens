import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTelemetryState,
  enterParagraph,
  recordHesitation,
  recordScrollVelocity,
  getStruggledTerms,
  TelemetryState,
  finalizeParagraph,
  serializeTelemetryState,
} from '@/engines/telemetryEngine';
import { saveTelemetrySnapshot } from '@/engines/persistenceEngine';
import { StruggledTerm } from '@/types/reader.types';
import { sendReaderTelemetry } from '@/lib/reader-api';

export function useTelemetry(fileId: string, sessionId?: string | null) {
  const stateRef = useRef<TelemetryState>(createTelemetryState());
  const [struggledTerms, setStruggledTerms] = useState<StruggledTerm[]>([]);
  const [frictionMap, setFrictionMap] = useState<Map<number, number>>(new Map());
  const [comprehensionMap, setComprehensionMap] = useState<Map<number, number>>(new Map());
  
  const lastScrollTelemetryAt = useRef(0);
  const sessionIdRef = useRef<string | null>(sessionId ?? null);

  useEffect(() => {
    sessionIdRef.current = sessionId ?? null;
  }, [sessionId]);

  const persistState = useCallback(() => {
    if (!fileId) return;
    const snapshot = serializeTelemetryState(stateRef.current);
    // Type assertion fixes the interface vs Record<string, unknown> mismatch 
    saveTelemetrySnapshot(fileId, snapshot as unknown as Record<string, unknown>);
  }, [fileId]);

  const emitTelemetry = useCallback(async (type: string, value: number, meta?: Record<string, unknown>) => {
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId || activeSessionId.startsWith('local:')) return;

    try {
      await sendReaderTelemetry({ sessionId: activeSessionId, type, value, meta });
    } catch {
      // Backend is best-effort
    }
  }, []);

  const updateFrictionMap = useCallback(() => {
    // Force a recalculation of the current active paragraph to get real-time dwell updates
    if (stateRef.current.currentParagraph >= 0) {
        stateRef.current = finalizeParagraph(stateRef.current);
        // Reset entry time so we don't double count if we stay on it
        stateRef.current.paragraphEntryTime = Date.now();
    }

    const fMap = new Map<number, number>();
    const cMap = new Map<number, number>();
    
    stateRef.current.paragraphs.forEach((p, idx) => {
      fMap.set(idx, p.frictionScore);
      cMap.set(idx, p.comprehensionScore);
    });

    setFrictionMap(fMap);
    setComprehensionMap(cMap);
    setStruggledTerms(getStruggledTerms(stateRef.current));
  }, []);

  // Native calculation derived directly from the active engine state
  const getCategorizedStruggles = useCallback(() => {
    const longStalls: number[] = [];
    const shortPauses: number[] = [];

    stateRef.current.paragraphs.forEach((p) => {
      // Expected dwell time: ~260ms per word (fallback to 2000ms minimum)
      const expectedDwell = Math.max((p.wordCount || 10) * 260, 2000);
      
      // If they spend 50% longer than the expected time, mark as a long stall
      if (p.dwellTimeMs > expectedDwell * 1.5) {
        longStalls.push(p.paragraphIndex);
      } 
      // If they hover/highlight multiple terms, mark as a short pause
      else if (p.hesitationCount > 2 || p.selectionCount > 0) {
        shortPauses.push(p.paragraphIndex);
      }
    });

    return { longStalls, shortPauses };
  }, []);

  const onParagraphEnter = useCallback((index: number, wordCount: number) => {
    const previousParagraph = stateRef.current.currentParagraph;
    const dwellMs = previousParagraph >= 0 ? Date.now() - stateRef.current.paragraphEntryTime : 0;

    stateRef.current = enterParagraph(stateRef.current, index, wordCount);
    updateFrictionMap();
    persistState();

    if (previousParagraph >= 0 && dwellMs > 0) {
      void emitTelemetry('pause', dwellMs / 1000, { paragraph: previousParagraph });
    }
  }, [emitTelemetry, persistState, updateFrictionMap]);

  const onHesitation = useCallback((paragraphIndex: number, word: string, isSelection: boolean = false) => {
    stateRef.current = recordHesitation(stateRef.current, paragraphIndex, word, isSelection);
    updateFrictionMap();
    persistState();
    
    void emitTelemetry(isSelection ? 'text_selection' : 'highlight_hover', 1, { paragraph: paragraphIndex, word });
  }, [emitTelemetry, persistState, updateFrictionMap]);

  const onScroll = useCallback((velocity: number) => {
    stateRef.current = recordScrollVelocity(stateRef.current, velocity);
    
    if (stateRef.current.currentParagraph >= 0) {
      const now = Date.now();
      if (now - lastScrollTelemetryAt.current > 900) {
        lastScrollTelemetryAt.current = now;
        void emitTelemetry('scroll', velocity, { paragraph: stateRef.current.currentParagraph });
      }
    }
  }, [emitTelemetry]);

  const getSessionData = useCallback(() => {
    if (stateRef.current.currentParagraph >= 0) {
      stateRef.current = enterParagraph(stateRef.current, -1);
    }
    persistState();
    return {
      paragraphs: Array.from(stateRef.current.paragraphs.values()),
      struggledTerms: getStruggledTerms(stateRef.current),
      categorizedStruggles: getCategorizedStruggles() 
    };
  }, [persistState, getCategorizedStruggles]);


  useEffect(() => {
    const interval = setInterval(() => {
      updateFrictionMap();
      
      // ADD THIS FOR TESTING:
      console.log("📊 LIVE TELEMETRY UPDATE:");
      console.log("Friction Map:", Object.fromEntries(frictionMap));
      console.log("Comprehension Map:", Object.fromEntries(comprehensionMap));
      console.log("Categorized Struggles:", getCategorizedStruggles());
      
    }, 2000); 
    return () => clearInterval(interval);
  }, [updateFrictionMap, frictionMap, comprehensionMap, getCategorizedStruggles]);

  return {
    onParagraphEnter,
    onHesitation,
    onScroll,
    frictionMap,
    comprehensionMap,
    struggledTerms,
    getSessionData,
    categorizedStruggles: getCategorizedStruggles()
  };
}