'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Languages, BarChart3, Eye, Loader2 } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

interface Props {
  fileName: string;
  progress: number;
  sessionStartTime?: number;
  onBack: () => void;
  onToggleCognates: () => void;
  onEndSession: () => void;
  cognatesEnabled: boolean;
  isScrolling: boolean;
  darkMode: boolean;
  fontFamily: string;
  onDarkModeChange: (v: boolean) => void;
  onFontChange: (v: string) => void;
  // Peek mode
  peekMode: boolean;
  onEnterPeek: () => void;
  onResumePeek: () => void;
  isEndingSession?: boolean;
}

function useSessionClock(startTime?: number) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const tick = () => setMins(Math.floor((Date.now() - startTime) / 60000));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startTime]);
  return mins;
}

export default function ZeroChromeLayer({
  fileName, progress, sessionStartTime,
  onBack, onToggleCognates, onEndSession,
  cognatesEnabled, isScrolling,
  darkMode, fontFamily, onDarkModeChange, onFontChange,
  peekMode, onEnterPeek, onResumePeek,
  isEndingSession = false,
}: Props) {
  const [visible, setVisible] = useState(true);
  const mouseTimeout = useRef<number | null>(null);
  const mins = useSessionClock(sessionStartTime);

  useEffect(() => {
    if (isScrolling) {
      setVisible(false);
      if (mouseTimeout.current) clearTimeout(mouseTimeout.current);
    }
  }, [isScrolling]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientY < 80) {
      setVisible(true);
      if (mouseTimeout.current) clearTimeout(mouseTimeout.current);
      mouseTimeout.current = window.setTimeout(() => setVisible(false), 3000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    const init = setTimeout(() => setVisible(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(init);
      if (mouseTimeout.current) clearTimeout(mouseTimeout.current);
    };
  }, [handleMouseMove]);

  return (
    <>
      {/* Peek bar */}
      <AnimatePresence>
        {peekMode && (
          <motion.div
            initial={{ opacity: 0, y: -48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -48 }}
            className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-5 bg-background/95 backdrop-blur border-b border-border shadow-sm"
          >
            <span className="text-sm font-semibold text-foreground truncate max-w-xs">{fileName}</span>
            <div className="flex items-center gap-3">
              {/* Progress */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <button
                onClick={onResumePeek}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                ↩ Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toolbar */}
      <AnimatePresence>
        {visible && !peekMode && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 px-6 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border"
          >
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition-colors text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</span>
              </div>
              {mins > 0 && (
                <span className="text-xs text-muted-foreground">{mins}m</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCognates}
                className={`p-2 rounded-xl transition-colors ${cognatesEnabled ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                title="Multi-Lingual Cognate Support"
              >
                <Languages className="w-5 h-5" />
              </button>
              <button
                onClick={onEnterPeek}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                title="Peek Mode (Esc)"
              >
                <Eye className="w-5 h-5" />
              </button>
              <SettingsPanel
                darkMode={darkMode}
                fontFamily={fontFamily}
                onDarkModeChange={onDarkModeChange}
                onFontChange={onFontChange}
              />
              <button
                onClick={onEndSession}
                disabled={isEndingSession}
                className={`p-2 rounded-xl transition-colors ${
                  isEndingSession 
                    ? 'opacity-50 cursor-not-allowed text-muted-foreground' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
                title="End Session & Review"
              >
                {isEndingSession ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <BarChart3 className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </>
  );
}
