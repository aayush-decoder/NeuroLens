import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTelemetryState,
  enterParagraph,
  recordHesitation,
  recordScrollVelocity,
  getStruggledTerms,
  TelemetryState,
} from '@/engines/telemetryEngine';
import { StruggledTerm } from '@/types/reader.types';

export function useTelemetry(fileId: string) {
  const stateRef = useRef<TelemetryState>(createTelemetryState());
  const [struggledTerms, setStruggledTerms] = useState<StruggledTerm[]>([]);
  const [frictionMap, setFrictionMap] = useState<Map<number, number>>(new Map());

  const onParagraphEnter = useCallback((index: number) => {
    stateRef.current = enterParagraph(stateRef.current, index);
    updateFrictionMap();
  }, []);

  const onHesitation = useCallback((paragraphIndex: number, word: string) => {
    stateRef.current = recordHesitation(stateRef.current, paragraphIndex, word);
    updateFrictionMap();
  }, []);

  const onScroll = useCallback((velocity: number) => {
    stateRef.current = recordScrollVelocity(stateRef.current, velocity);
  }, []);

  const updateFrictionMap = useCallback(() => {
    const map = new Map<number, number>();
    stateRef.current.paragraphs.forEach((p, idx) => {
      map.set(idx, p.frictionScore);
    });
    setFrictionMap(new Map(map));
    setStruggledTerms(getStruggledTerms(stateRef.current));
  }, []);

  const getSessionData = useCallback(() => {
    // Finalize current paragraph
    if (stateRef.current.currentParagraph >= 0) {
      stateRef.current = enterParagraph(stateRef.current, -1);
    }
    return {
      paragraphs: Array.from(stateRef.current.paragraphs.values()),
      struggledTerms: getStruggledTerms(stateRef.current),
    };
  }, []);

  // Periodically update friction map
  useEffect(() => {
    const interval = setInterval(updateFrictionMap, 3000);
    return () => clearInterval(interval);
  }, [updateFrictionMap]);

  return {
    onParagraphEnter,
    onHesitation,
    onScroll,
    frictionMap,
    struggledTerms,
    getSessionData,
  };
}
