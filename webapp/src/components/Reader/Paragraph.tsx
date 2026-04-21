// src/components/Reader/Paragraph.tsx
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdaptationsForText, isComplexWord, getDefinition, getSynonym, getCognate, expandAcronym } from '@/engines/adaptationEngine';
import SimplifiedPhraseTooltip from './SimplifiedPhraseTooltip';
import SelectionActionTooltip from './SelectionActionTooltip';
import { SimplifiedPhrase, HighlightedPhrase } from '@/hooks/reader/useSimplifiedPhrases';

interface Props {
  text: string;
  index: number;
  frictionScore: number;
  onEnter: (index: number, wordCount: number) => void;
  onHesitation: (index: number, word: string, isSelection?: boolean) => void;
  showCognates: boolean;
  lineHeight: number;
  fontWeight: number;
  isTranslated?: boolean;
  isAdapted?: boolean;
  onVisible?: (index: number, text: string) => void;
  onHidden?: (index: number) => void;
  gloss?: any;
  fontFamily?: string;
  // Selection → Simplify / Highlight
  onSimplifyRequest?: (opts: {
    phrase: string;
    paragraphText: string;
    startOffset: number;
    endOffset: number;
  }) => Promise<void>;
  onHighlightRequest?: (opts: {
    phrase: string;
    startOffset: number;
    endOffset: number;
  }) => void;
  onUnhighlightRequest?: (id: string) => void;
  isSimplifying?: boolean;
  simplifiedPhrases?: SimplifiedPhrase[];
  highlightedPhrases?: HighlightedPhrase[];
}

export default function Paragraph({
  text,
  index,
  frictionScore,
  onEnter,
  onHesitation,
  showCognates,
  lineHeight,
  fontWeight,
  isTranslated = false,
  isAdapted = false,
  onVisible,
  onHidden,
  onSimplifyRequest,
  onHighlightRequest,
  onUnhighlightRequest,
  isSimplifying = false,
  simplifiedPhrases = [],
  highlightedPhrases = [],
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  // --- Simplified phrase hover state ---
  const [hoveredSimplifiedPhrase, setHoveredSimplifiedPhrase] = useState<SimplifiedPhrase | null>(null);
  const [simplifiedTooltipPos, setSimplifiedTooltipPos] = useState({ x: 0, y: 0 });

  // --- Selection action tooltip state ---
  const [selectionTooltip, setSelectionTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    phrase: string;
    startOffset: number;
    endOffset: number;
  }>({ visible: false, x: 0, y: 0, phrase: '', startOffset: 0, endOffset: 0 });

  useEffect(() => {
    if (isAdapted) {
      console.log(`📖 PARAGRAPH ${index} is ADAPTED, showing:`, text.substring(0, 80) + '...');
    }
  }, [isAdapted, index, text]);

  const wordCount = useMemo(() => text.split(/\s+/).filter(w => w.length > 0).length, [text]);

  // ── Intersection observers ─────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onEnter(index, wordCount);
      },
      { rootMargin: '-100px 0px -50% 0px', threshold: 0 }
    );

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (onVisible) onVisible(index, text);
        } else {
          if (onHidden) onHidden(index);
        }
      },
      { rootMargin: '0px', threshold: 0 }
    );

    activeObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      activeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [index, onEnter, onVisible, onHidden, text, wordCount]);

  // ── Mouse-up → selection tooltip ──────────────────────────────────────────
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // small delay so browser finalises the selection
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() || '';

      if (!selectedText || selectedText.length === 0) {
        setSelectionTooltip(s => ({ ...s, visible: false }));
        return;
      }

      // Telemetry for small selections (≤5 words)
      if (selectedText.split(/\s+/).length <= 5) {
        onHesitation(index, selectedText, true);
      }

      // Find character offset of the selected phrase within the paragraph text
      // Try exact match first, then case-insensitive
      let startOffset = text.indexOf(selectedText);
      if (startOffset < 0) startOffset = text.toLowerCase().indexOf(selectedText.toLowerCase());
      const endOffset = startOffset >= 0 ? startOffset + selectedText.length : selectedText.length;

      // Position tooltip near selection — use viewport coords (fixed positioning)
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const topY = rect.top - 4; // NO scrollY: tooltip uses position:fixed

      setSelectionTooltip({
        visible: true,
        x: midX,
        y: topY,
        phrase: selectedText,
        startOffset: Math.max(0, startOffset),
        endOffset,
      });
    }, 50);
  }, [index, onHesitation, text]);

  const dismissSelectionTooltip = useCallback(() => {
    setSelectionTooltip(s => ({ ...s, visible: false }));
  }, []);

  const handleHighlight = useCallback(() => {
    dismissSelectionTooltip();
    if (onHighlightRequest && selectionTooltip.startOffset >= 0) {
      onHighlightRequest({
        phrase: selectionTooltip.phrase,
        startOffset: selectionTooltip.startOffset,
        endOffset: selectionTooltip.endOffset,
      });
    }
    window.getSelection()?.removeAllRanges();
  }, [dismissSelectionTooltip, onHighlightRequest, selectionTooltip]);

  const handleSimplify = useCallback(async () => {
    dismissSelectionTooltip();
    if (onSimplifyRequest && selectionTooltip.startOffset >= 0) {
      await onSimplifyRequest({
        phrase: selectionTooltip.phrase,
        paragraphText: text,
        startOffset: selectionTooltip.startOffset,
        endOffset: selectionTooltip.endOffset,
      });
    }
    window.getSelection()?.removeAllRanges();
  }, [dismissSelectionTooltip, onSimplifyRequest, selectionTooltip, text]);

  // ── Word hover (existing glossary tooltip) ──────────────────────────────
  const handleWordHover = useCallback((word: string, e: React.MouseEvent) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = window.setTimeout(() => {
      const clean = word.replace(/[.,;:!?'"()]/g, '');
      if (isComplexWord(clean) || expandAcronym(clean)) {
        onHesitation(index, clean, false);
        setHoveredWord(clean);
        setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
      }
    }, 600);
  }, [index, onHesitation]);

  const handleWordLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredWord(null);
  }, []);

  const adaptations = useMemo(() => {
    if (isTranslated || isAdapted) return [];
    return getAdaptationsForText(text, frictionScore);
  }, [text, frictionScore, isTranslated, isAdapted]);

  // ── Render text with simplified/highlighted spans ──────────────────────
  //
  // renderWithMarkup: splits rawText by known highlighted/simplified ranges
  // and wraps each segment in the appropriate styled span.
  // This is called for EVERY paragraph (adapted or not).
  const renderWithMarkup = useCallback((rawText: string): React.ReactNode => {
    type MarkedRange = {
      start: number;
      end: number;
      type: 'simplified' | 'highlighted';
      phrase?: SimplifiedPhrase;
      highlight?: HighlightedPhrase;
    };

    const ranges: MarkedRange[] = [
      ...highlightedPhrases.map(h => ({
        start: h.startOffset,
        end: h.endOffset,
        type: 'highlighted' as const,
        highlight: h,
      })),
      ...simplifiedPhrases.map(p => ({
        start: p.startOffset,
        end: p.endOffset,
        type: 'simplified' as const,
        phrase: p,
      })),
    ].sort((a, b) => a.start - b.start);

    if (ranges.length === 0) return rawText;

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    ranges.forEach((range, ri) => {
      if (range.start < 0 || range.end > rawText.length || range.start >= range.end) return;

      if (cursor < range.start) {
        nodes.push(<React.Fragment key={`txt-${ri}`}>{rawText.slice(cursor, range.start)}</React.Fragment>);
      }

      const segment = rawText.slice(range.start, range.end);

      if (range.type === 'simplified' && range.phrase) {
        const phrase = range.phrase;
        nodes.push(
          <span
            key={`sp-${ri}`}
            style={{ borderBottom: '2px solid #f472b6', cursor: 'help' }}
            className="bg-pink-50/60 dark:bg-pink-900/20 rounded-sm transition-colors duration-150 hover:bg-pink-100/80"
            onMouseEnter={(e) => {
              // Use pure clientY — SimplifiedPhraseTooltip uses position:fixed (viewport coords)
              setHoveredSimplifiedPhrase(phrase);
              setSimplifiedTooltipPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setHoveredSimplifiedPhrase(null)}
          >
            {segment}
          </span>
        );
      } else if (range.type === 'highlighted' && range.highlight) {
        const hl = range.highlight;
        nodes.push(
          <span
            key={`hl-${ri}`}
            className="group relative inline"
          >
            <span
              style={{ backgroundColor: 'rgba(253, 224, 71, 0.55)', borderRadius: '3px', padding: '0 2px' }}
            >
              {segment}
            </span>
            {/* Unhighlight button — visible on hover */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnhighlightRequest?.(hl.id);
              }}
              title="Remove highlight"
              className="
                inline-flex items-center justify-center
                ml-0.5 w-3.5 h-3.5 rounded-full
                bg-amber-300/80 hover:bg-red-400
                text-amber-900 hover:text-white
                text-[9px] font-bold leading-none
                opacity-0 group-hover:opacity-100
                transition-all duration-150
                cursor-pointer select-none align-middle
              "
              style={{ fontSize: '9px', verticalAlign: 'middle' }}
            >
              ✕
            </button>
          </span>
        );
      }

      cursor = range.end;
    });

    if (cursor < rawText.length) {
      nodes.push(<React.Fragment key="txt-tail">{rawText.slice(cursor)}</React.Fragment>);
    }

    return <>{nodes}</>;
  }, [highlightedPhrases, simplifiedPhrases, onUnhighlightRequest]);

  const renderText = () => {
    const hasMarkup = highlightedPhrases.length > 0 || simplifiedPhrases.length > 0;

    if (isAdapted) {
      // Adapted paragraphs: apply markup over the plain text
      return (
        <span
          style={{ whiteSpace: 'pre-wrap' }}
          className="bg-green-50 dark:bg-green-900/20 px-0.5 rounded"
        >
          {renderWithMarkup(text)}
        </span>
      );
    }

    // Non-adapted: if any highlights/simplifications exist, use markup renderer
    // (mixing word-by-word + range markup is complex; markup takes priority)
    if (hasMarkup) {
      return renderWithMarkup(text);
    }

    // Otherwise: standard word-by-word for glossary / local adaptations
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (/^\s+$/.test(word)) return word;
      const clean = word.replace(/[.,;:!?'"()]/g, '');
      const isAdaptedWord = adaptations.some(a => a.original.toLowerCase() === clean.toLowerCase());
      const isComplex = isComplexWord(clean);
      const acronymExpansion = expandAcronym(clean);

      return (
        <span
          key={i}
          onMouseEnter={(e) => handleWordHover(word, e)}
          onMouseLeave={handleWordLeave}
          className={`transition-colors ${
            isComplex ? 'border-b border-dotted border-primary/40 cursor-help' : ''
          } ${
            isAdaptedWord ? 'text-primary font-medium' : ''
          }`}
        >
          {word}
          {isAdaptedWord && frictionScore > 0.6 && (
            <span className="text-xs text-primary/70 ml-0.5">[{getSynonym(clean)}]</span>
          )}
          {acronymExpansion && frictionScore > 0.5 && (
            <span className="text-xs text-muted-foreground ml-0.5">({acronymExpansion})</span>
          )}
        </span>
      );
    });
  };

  const tooltipContent = useMemo(() => {
    if (!hoveredWord) return null;
    const def = getDefinition(hoveredWord);
    const syn = getSynonym(hoveredWord);
    const cog = showCognates ? getCognate(hoveredWord) : null;
    const acr = expandAcronym(hoveredWord);
    if (!def && !syn && !cog && !acr) return null;
    return { def, syn, cog, acr };
  }, [hoveredWord, showCognates]);

  return (
    <div className="relative" data-index={index}>
      <p
        ref={ref}
        onMouseUp={handleMouseUp}
        className="reader-text mb-6 max-w-[65ch] mx-auto px-6 transition-all duration-1000 selection:bg-primary/20 selection:text-foreground"
        style={{ lineHeight, fontWeight }}
      >
        {renderText()}
      </p>

      {/* Word-hover glossary tooltip */}
      <AnimatePresence>
        {hoveredWord && tooltipContent && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-50 bg-card border border-border rounded-xl shadow-lg px-4 py-3 max-w-xs"
            style={{ left: tooltipPos.x - 100, top: tooltipPos.y - 10 }}
          >
            <p className="font-serif font-bold text-sm text-foreground">{hoveredWord}</p>
            {tooltipContent.def && <p className="text-xs text-muted-foreground mt-1">{tooltipContent.def}</p>}
            {tooltipContent.syn && <p className="text-xs text-primary mt-0.5">→ {tooltipContent.syn}</p>}
            {tooltipContent.cog && <p className="text-xs text-accent mt-0.5">🌐 {tooltipContent.cog}</p>}
            {tooltipContent.acr && <p className="text-xs text-muted-foreground mt-0.5">= {tooltipContent.acr}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplified Phrase Hover Tooltip */}
      <AnimatePresence>
        {hoveredSimplifiedPhrase && (
          <SimplifiedPhraseTooltip
            simplifiedPhrase={hoveredSimplifiedPhrase.simplifiedPhrase}
            explanation={hoveredSimplifiedPhrase.explanation}
            originalPhrase={hoveredSimplifiedPhrase.originalPhrase}
            position={simplifiedTooltipPos}
          />
        )}
      </AnimatePresence>

      {/* Selection Action Tooltip (Highlight / Simplify) */}
      <SelectionActionTooltip
        visible={selectionTooltip.visible}
        position={{ x: selectionTooltip.x, y: selectionTooltip.y }}
        selectedText={selectionTooltip.phrase}
        isSimplifying={isSimplifying}
        onHighlight={handleHighlight}
        onSimplify={handleSimplify}
        onDismiss={dismissSelectionTooltip}
      />
    </div>
  );
}