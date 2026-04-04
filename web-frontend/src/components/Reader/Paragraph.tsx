import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAdaptationsForText, isComplexWord, getDefinition, getSynonym, getCognate, expandAcronym } from '@/engines/adaptationEngine';
import { TextAdaptation } from '@/types/reader.types';

interface Props {
  text: string;
  index: number;
  frictionScore: number;
  onEnter: (index: number) => void;
  onHesitation: (index: number, word: string) => void;
  showCognates: boolean;
  lineHeight: number;
  fontWeight: number;
}

export default function Paragraph({ text, index, frictionScore, onEnter, onHesitation, showCognates, lineHeight, fontWeight }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  // IntersectionObserver for paragraph visibility
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          onEnter(index);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, onEnter]);

  const adaptations = useMemo(() => {
    return getAdaptationsForText(text, frictionScore);
  }, [text, frictionScore]);

  const handleWordHover = useCallback((word: string, e: React.MouseEvent) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = window.setTimeout(() => {
      const clean = word.replace(/[.,;:!?'"()]/g, '');
      if (isComplexWord(clean) || expandAcronym(clean.replace(/[.,;:!?'"()]/g, ''))) {
        onHesitation(index, clean);
        setHoveredWord(clean);
        setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
      }
    }, 600);
  }, [index, onHesitation]);

  const handleWordLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredWord(null);
  }, []);

  const renderText = () => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (/^\s+$/.test(word)) return word;
      const clean = word.replace(/[.,;:!?'"()]/g, '');
      const isAdapted = adaptations.some(a => a.original.toLowerCase() === clean.toLowerCase());
      const isComplex = isComplexWord(clean);
      const acronymExpansion = expandAcronym(clean);

      return (
        <span
          key={i}
          onMouseEnter={(e) => handleWordHover(word, e)}
          onMouseLeave={handleWordLeave}
          className={`${isComplex ? 'border-b border-dotted border-primary/40 cursor-help' : ''} ${isAdapted ? 'text-primary' : ''}`}
        >
          {word}
          {isAdapted && frictionScore > 0.6 && (
            <span className="text-xs text-primary/70 ml-0.5">
              [{getSynonym(clean)}]
            </span>
          )}
          {acronymExpansion && frictionScore > 0.5 && (
            <span className="text-xs text-muted-foreground ml-0.5">
              ({acronymExpansion})
            </span>
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
    <div className="relative">
      <p
        ref={ref}
        className="reader-text mb-6 max-w-[65ch] mx-auto px-6 transition-all duration-1000"
        style={{ lineHeight, fontWeight }}
      >
        {renderText()}
      </p>

      {/* Tooltip */}
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
    </div>
  );
}
