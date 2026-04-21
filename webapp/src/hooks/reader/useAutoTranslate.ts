/**
 * useAutoTranslate Hook
 *
 * Detects when user is stalling on adapted (simplified) text for 5+ seconds,
 * then calls /api/translate to provide cognate/definition in preferred language
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface ParagraphTranslationState {
  startTime: number; // When paragraph was first adapted/viewed
  isAdapted: boolean;
  isTranslating: boolean;
  hasTranslated: boolean;
  translationTimer?: ReturnType<typeof setTimeout>;
}

export function useAutoTranslate(
  preferredLanguage: string = 'hindi',
  stallThresholdMs: number = 5000 // 5 seconds
) {
  const [translatedParagraphs, setTranslatedParagraphs] = useState<Record<number, string>>({});
  const stateRef = useRef<Map<number, ParagraphTranslationState>>(new Map());
  const visibleParagraphsRef = useRef<Set<number>>(new Set());

  /**
   * Call translate API and update state with translated text
   */
  const triggerTranslation = useCallback(async (
    paragraphIndex: number,
    adaptedText: string
  ) => {
    const state = stateRef.current.get(paragraphIndex);
    if (!state) return;

    state.isTranslating = true;
    // console.log(`🌐 [useAutoTranslate] Starting translation for paragraph ${paragraphIndex} to ${preferredLanguage}...`);

    try {
      // console.log(`🌐 [useAutoTranslate] Calling /api/translate with ${adaptedText.length} chars...`);
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: adaptedText,
          language: preferredLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.translatedText || adaptedText;

      // console.log(`✅ [useAutoTranslate] Translation complete for paragraph ${paragraphIndex}!`);
      // console.log(`   Original (${adaptedText.length}): ${adaptedText.substring(0, 60)}...`);
      // console.log(`   Translated (${translatedText.length}): ${translatedText.substring(0, 60)}...`);

      // Update state with translated version
      setTranslatedParagraphs(prev => ({
        ...prev,
        [paragraphIndex]: translatedText,
      }));

      if (state) {
        state.hasTranslated = true;
      }
    } catch (error) {
      // console.error(`❌ [useAutoTranslate] Translation failed for paragraph ${paragraphIndex}:`, error);
    } finally {
      state.isTranslating = false;
    }
  }, [preferredLanguage]);

  /**
   * Track when a paragraph becomes visible/adapted
   */
  const onParagraphAdapted = useCallback((
    paragraphIndex: number,
    adaptedText: string
  ) => {
    // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex} adapted, starting 5s timer...`);
    const existing = stateRef.current.get(paragraphIndex);

    // Clear old timer if exists
    if (existing?.translationTimer) {
      clearTimeout(existing.translationTimer);
    }

    // Create new state for this paragraph
    const state: ParagraphTranslationState = {
      startTime: Date.now(),
      isAdapted: true,
      isTranslating: false,
      hasTranslated: !!translatedParagraphs[paragraphIndex],
    };

    stateRef.current.set(paragraphIndex, state);

    // Schedule translation check after threshold
    const timer = setTimeout(() => {
      const current = stateRef.current.get(paragraphIndex);
      if (!current) {
        // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex}: State cleared, skipping`);
        return;
      }

      const isVisible = visibleParagraphsRef.current.has(paragraphIndex);
      // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex}: 5s timer fired. Visible=${isVisible}, Translated=${current.hasTranslated}, Translating=${current.isTranslating}`);

      if (!isVisible) {
        // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex}: Not visible, skipping translation`);
        return;
      }

      const dwellTime = Date.now() - current.startTime;
      
      // Only translate if user has been stalling and not already translated
      if (dwellTime >= stallThresholdMs && !current.hasTranslated && !current.isTranslating) {
        // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex}: TRIGGERING TRANSLATION (dwell=${dwellTime}ms)`);
        void triggerTranslation(paragraphIndex, adaptedText);
      } else {
        // console.log(`🌐 [useAutoTranslate] Paragraph ${paragraphIndex}: Conditions NOT met. DwellOk=${dwellTime >= stallThresholdMs}, NotTranslated=${!current.hasTranslated}, NotTranslating=${!current.isTranslating}`);
      }
    }, stallThresholdMs);

    state.translationTimer = timer;
  }, [translatedParagraphs, stallThresholdMs, triggerTranslation]);

  /**
   * Track paragraph visibility (when user is viewing it)
   */
  const onParagraphVisible = useCallback((paragraphIndex: number) => {
    // console.log(`👁️  [useAutoTranslate] Paragraph ${paragraphIndex} VISIBLE`);
    visibleParagraphsRef.current.add(paragraphIndex);
  }, []);

  /**
   * Track when paragraph leaves viewport
   */
  const onParagraphHidden = useCallback((paragraphIndex: number) => {
    // console.log(`👁️  [useAutoTranslate] Paragraph ${paragraphIndex} HIDDEN`);
    visibleParagraphsRef.current.delete(paragraphIndex);

    const state = stateRef.current.get(paragraphIndex);
    if (state?.translationTimer) {
      // console.log(`🌐 [useAutoTranslate] Clearing timer for paragraph ${paragraphIndex}`);
      clearTimeout(state.translationTimer);
      state.translationTimer = undefined;
    }
  }, []);

  /**
   * Get the translated version of a paragraph (or original if not translated)
   */
  const getTranslatedText = useCallback((
    paragraphIndex: number,
    adaptedText: string
  ): string => {
    return translatedParagraphs[paragraphIndex] || adaptedText;
  }, [translatedParagraphs]);

  /**
   * Check if a paragraph has translation in progress
   */
  const isTranslating = useCallback((paragraphIndex: number): boolean => {
    const state = stateRef.current.get(paragraphIndex);
    return state?.isTranslating ?? false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const stateMap = stateRef.current;
      const visibleParagraphs = visibleParagraphsRef.current;
      stateMap.forEach(state => {
        if (state.translationTimer) {
          clearTimeout(state.translationTimer);
        }
      });
      stateMap.clear();
      visibleParagraphs.clear();
    };
  }, []);

  return {
    translatedParagraphs,
    onParagraphAdapted,
    onParagraphVisible,
    onParagraphHidden,
    getTranslatedText,
    isTranslating,
  };
}
