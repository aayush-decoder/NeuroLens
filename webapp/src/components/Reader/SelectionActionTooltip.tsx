// src/components/Reader/SelectionActionTooltip.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  isSimplifying: boolean;
  onHighlight: () => void;
  onSimplify: () => void;
  onDismiss: () => void;
}

export default function SelectionActionTooltip({
  visible,
  position,
  selectedText,
  isSimplifying,
  onHighlight,
  onSimplify,
  onDismiss,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss when clicking outside
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // slight delay so the mouseup that showed this doesn't immediately dismiss it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [visible, onDismiss]);

  // Clamp position so tooltip doesn't overflow viewport
  const OFFSET_Y = 52;
  const tooltipWidth = 220;
  const clampedX = Math.min(
    Math.max(position.x - tooltipWidth / 2, 8),
    (typeof window !== 'undefined' ? window.innerWidth : 1200) - tooltipWidth - 8
  );
  const clampedY = Math.max(position.y - OFFSET_Y, 8);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[9999] select-none"
          style={{ left: clampedX, top: clampedY }}
        >
          <div
            className="
              flex items-center gap-1 px-1 py-1 rounded-2xl shadow-2xl border
              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md
              border-zinc-200/60 dark:border-zinc-700/60
            "
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            }}
          >
            {/* Highlight button */}
            <button
              id="selection-highlight-btn"
              onClick={(e) => {
                e.stopPropagation();
                onHighlight();
              }}
              title="Highlight this phrase"
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                text-amber-700 dark:text-amber-400
                bg-amber-50 dark:bg-amber-900/30
                hover:bg-amber-100 dark:hover:bg-amber-800/40
                transition-all duration-150 cursor-pointer
              "
            >
              <span className="text-sm">✏️</span>
              Highlight
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

            {/* Simplify button */}
            <button
              id="selection-simplify-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSimplify();
              }}
              disabled={isSimplifying}
              title="Simplify this phrase with AI"
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                text-violet-700 dark:text-violet-400
                bg-violet-50 dark:bg-violet-900/30
                hover:bg-violet-100 dark:hover:bg-violet-800/40
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 cursor-pointer
              "
            >
              {isSimplifying ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  Simplifying…
                </>
              ) : (
                <>
                  <span className="text-sm">✨</span>
                  Simplify
                </>
              )}
            </button>
          </div>

          {/* little caret pointer */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 rotate-45
              bg-white dark:bg-zinc-900 border-b border-r
              border-zinc-200/60 dark:border-zinc-700/60"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
