// src/hooks/reader/useSimplifiedPhrases.ts
import { useState, useCallback } from 'react';

export interface SimplifiedPhrase {
  id: string;
  paragraphIndex: number;
  originalPhrase: string;
  simplifiedPhrase: string;
  explanation: string;
  startOffset: number;
  endOffset: number;
  timestamp: number;
}

export interface HighlightedPhrase {
  id: string;
  paragraphIndex: number;
  phrase: string;
  startOffset: number;
  endOffset: number;
  timestamp: number;
}

export function useSimplifiedPhrases() {
  const [simplifiedPhrases, setSimplifiedPhrases] = useState<SimplifiedPhrase[]>([]);
  const [highlightedPhrases, setHighlightedPhrases] = useState<HighlightedPhrase[]>([]);
  const [isSimplifying, setIsSimplifying] = useState(false);

  const addSimplifiedPhrase = useCallback((phrase: SimplifiedPhrase) => {
    setSimplifiedPhrases(prev => {
      // Avoid duplicates for same paragraph + same original phrase
      const exists = prev.some(
        p => p.paragraphIndex === phrase.paragraphIndex && p.originalPhrase === phrase.originalPhrase
      );
      if (exists) return prev;
      return [...prev, phrase];
    });
  }, []);

  const addHighlightedPhrase = useCallback((highlight: HighlightedPhrase) => {
    setHighlightedPhrases(prev => {
      const exists = prev.some(
        p => p.paragraphIndex === highlight.paragraphIndex && p.phrase === highlight.phrase
      );
      if (exists) return prev;
      return [...prev, highlight];
    });
  }, []);

  const simplifyPhrase = useCallback(
    async (opts: {
      paragraphIndex: number;
      phrase: string;
      paragraphText: string;
      startOffset: number;
      endOffset: number;
    }): Promise<SimplifiedPhrase | null> => {
      setIsSimplifying(true);
      try {
        const res = await fetch('/api/simplify-phrase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paragraph: opts.paragraphText,
            phrase: opts.phrase,
          }),
        });

        if (!res.ok) {
          console.error('[useSimplifiedPhrases] API error:', res.status);
          return null;
        }

        const data = await res.json();

        const result: SimplifiedPhrase = {
          id: crypto.randomUUID(),
          paragraphIndex: opts.paragraphIndex,
          originalPhrase: opts.phrase,
          simplifiedPhrase: data.simplifiedPhrase,
          explanation: data.explanation,
          startOffset: opts.startOffset,
          endOffset: opts.endOffset,
          timestamp: Date.now(),
        };

        addSimplifiedPhrase(result);
        return result;
      } catch (err) {
        console.error('[useSimplifiedPhrases] simplifyPhrase error:', err);
        return null;
      } finally {
        setIsSimplifying(false);
      }
    },
    [addSimplifiedPhrase]
  );

  const getPhrasesForParagraph = useCallback(
    (paragraphIndex: number): SimplifiedPhrase[] => {
      return simplifiedPhrases.filter(p => p.paragraphIndex === paragraphIndex);
    },
    [simplifiedPhrases]
  );

  const getHighlightsForParagraph = useCallback(
    (paragraphIndex: number): HighlightedPhrase[] => {
      return highlightedPhrases.filter(h => h.paragraphIndex === paragraphIndex);
    },
    [highlightedPhrases]
  );

  const removeHighlight = useCallback((id: string) => {
    setHighlightedPhrases(prev => prev.filter(h => h.id !== id));
  }, []);

  return {
    simplifiedPhrases,
    highlightedPhrases,
    isSimplifying,
    simplifyPhrase,
    addHighlightedPhrase,
    removeHighlight,
    getPhrasesForParagraph,
    getHighlightsForParagraph,
  };
}
