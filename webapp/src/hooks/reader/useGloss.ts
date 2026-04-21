/**
 * useGloss
 *
 * Mirrors extension telemetry.js gloss behaviour:
 *   10s dwell → English inline gloss
 *   20s dwell → transition to Hindi
 *
 * Returns:
 *   glossMap: Map<paragraphIndex, { words: GlossWord[], hindi: boolean }>
 *   onParagraphVisible(index, text): call when a paragraph enters viewport
 *   onParagraphHidden(index): call when it leaves
 *   glossedWordList: flat list of glossed word strings (for concept graph)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { scanWordmap } from '@/lib/wordmap';

export interface GlossWord {
  original: string;
  meaning: string;
  hindi: string;
}

export interface GlossEntry {
  words: GlossWord[];
  hindi: boolean;
}

export function useGloss() {
  const [glossMap, setGlossMap] = useState<Map<number, GlossEntry>>(new Map());
  const entryTimers = useRef<Map<number, { gloss: ReturnType<typeof setTimeout>; hindi: ReturnType<typeof setTimeout> }>>(new Map());
  const texts = useRef<Map<number, string>>(new Map());

  const onParagraphVisible = useCallback((index: number, text: string) => {
    texts.current.set(index, text);
    if (entryTimers.current.has(index)) return; // already scheduled

    const glossTimer = setTimeout(() => {
      const t = texts.current.get(index) || '';
      const words = scanWordmap(t);
      if (!words.length) return;
      setGlossMap(prev => {
        const next = new Map(prev);
        next.set(index, { words, hindi: false });
        return next;
      });
    }, 10_000);

    const hindiTimer = setTimeout(() => {
      setGlossMap(prev => {
        const entry = prev.get(index);
        if (!entry) return prev;
        const next = new Map(prev);
        next.set(index, { ...entry, hindi: true });
        return next;
      });
    }, 20_000);

    entryTimers.current.set(index, { gloss: glossTimer, hindi: hindiTimer });
  }, []);

  const onParagraphHidden = useCallback((index: number) => {
    const timers = entryTimers.current.get(index);
    if (timers) {
      clearTimeout(timers.gloss);
      clearTimeout(timers.hindi);
      entryTimers.current.delete(index);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timers = entryTimers.current;
    return () => {
      timers.forEach(t => { clearTimeout(t.gloss); clearTimeout(t.hindi); });
    };
  }, []);

  const glossedWordList = Array.from(glossMap.values())
    .flatMap(e => e.words.map(w => w.original.toLowerCase()));

  return { glossMap, onParagraphVisible, onParagraphHidden, glossedWordList };
}
