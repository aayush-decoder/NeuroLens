import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Languages, BarChart3 } from 'lucide-react';

interface Props {
  fileName: string;
  progress: number;
  onBack: () => void;
  onToggleCognates: () => void;
  onEndSession: () => void;
  cognatesEnabled: boolean;
  isScrolling: boolean;
}

export default function ZeroChromeLayer({ fileName, progress, onBack, onToggleCognates, onEndSession, cognatesEnabled, isScrolling }: Props) {
  const [visible, setVisible] = useState(true);
  const mouseTimeout = useRef<number | null>(null);

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
    // Show initially then auto-hide
    const init = setTimeout(() => setVisible(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(init);
      if (mouseTimeout.current) clearTimeout(mouseTimeout.current);
    };
  }, [handleMouseMove]);

  return (
    <>
      <AnimatePresence>
        {visible && (
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
                onClick={onEndSession}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                title="End Session & Review"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Progress bar - always visible subtly */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <motion.div
          className="h-full gradient-teal"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </>
  );
}
