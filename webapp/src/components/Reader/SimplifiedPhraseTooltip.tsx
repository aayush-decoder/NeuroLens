// src/components/Reader/SimplifiedPhraseTooltip.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  simplifiedPhrase: string;
  explanation: string;
  // position is in VIEWPORT coordinates (clientX / clientY)
  position: { x: number; y: number };
  originalPhrase?: string;
}

export default function SimplifiedPhraseTooltip({
  simplifiedPhrase,
  explanation,
  position,
  originalPhrase,
}: Props) {
  const [showExplanation, setShowExplanation] = useState(false);

  const tooltipWidth = 310;
  const OFFSET_BELOW = 18; // px gap below the cursor

  const clampedX = Math.min(
    Math.max(position.x - tooltipWidth / 2, 8),
    (typeof window !== 'undefined' ? window.innerWidth : 1200) - tooltipWidth - 8
  );

  // Render BELOW the phrase — if near bottom, flip to above
  const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - position.y : 999;
  const flipUp = spaceBelow < 220;
  const top = flipUp ? position.y - 220 : position.y + OFFSET_BELOW;

  return (
    <motion.div
      initial={{ opacity: 0, y: flipUp ? -6 : 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="fixed pointer-events-auto"
      style={{ left: clampedX, top, width: tooltipWidth, zIndex: 10000 }}
    >
      {/* Caret pointing UP when below phrase */}
      {!flipUp && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[7px] w-3 h-3 rotate-45
            bg-white dark:bg-zinc-900
            border-t border-l border-pink-200/70 dark:border-pink-800/50"
          style={{ transform: 'translateX(-50%) rotate(45deg)' }}
        />
      )}

      <div
        className="rounded-2xl border shadow-2xl overflow-hidden
          bg-white dark:bg-zinc-900
          border-pink-200/70 dark:border-pink-800/50"
        style={{ boxShadow: '0 12px 40px rgba(236,72,153,0.15), 0 2px 12px rgba(0,0,0,0.14)' }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 border-b border-pink-100 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/40">
          <span className="text-pink-500 dark:text-pink-400 text-xs font-bold uppercase tracking-widest">
            ✨ Simplified
          </span>
        </div>

        {/* Simplified phrase */}
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed">
            {simplifiedPhrase}
          </p>
          {originalPhrase && (
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 italic line-clamp-1">
              was: "{originalPhrase}"
            </p>
          )}
        </div>

        {/* Explainability toggle */}
        <div className="px-4 pb-3">
          <button
            id="simplified-phrase-explain-btn"
            onClick={(e) => { e.stopPropagation(); setShowExplanation(s => !s); }}
            className="flex items-center gap-1.5 text-xs font-semibold
              text-violet-600 dark:text-violet-400
              hover:text-violet-800 dark:hover:text-violet-200
              transition-colors duration-150"
          >
            <span>{showExplanation ? '🔼' : '🧠'}</span>
            {showExplanation ? 'Hide AI thinking' : 'Why did AI simplify this?'}
          </button>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/60">
                <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
                  {explanation}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Caret pointing DOWN when above phrase (flipped) */}
      {flipUp && (
        <div
          className="absolute left-1/2 -bottom-[7px] w-3 h-3
            bg-white dark:bg-zinc-900
            border-b border-r border-pink-200/70 dark:border-pink-800/50"
          style={{ transform: 'translateX(-50%) rotate(45deg)' }}
        />
      )}
    </motion.div>
  );
}
