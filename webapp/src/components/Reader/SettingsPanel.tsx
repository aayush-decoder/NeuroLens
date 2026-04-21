'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

const FONTS = [
  { label: 'Default (Georgia)', value: '' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
  { label: 'Source Serif 4', value: "'Source Serif 4', serif" },
  { label: 'Monospace', value: 'monospace' },
];

const GFONT_MAP: Record<string, string> = {
  "'Inter', sans-serif": 'Inter',
  "'Merriweather', serif": 'Merriweather',
  "'Roboto', sans-serif": 'Roboto',
  "'Open Sans', sans-serif": 'Open+Sans',
  "'Lato', sans-serif": 'Lato',
  "'Nunito', sans-serif": 'Nunito',
  "'Source Serif 4', serif": 'Source+Serif+4',
};

interface Props {
  darkMode: boolean;
  fontFamily: string;
  onDarkModeChange: (v: boolean) => void;
  onFontChange: (v: string) => void;
}

export default function SettingsPanel({ darkMode, fontFamily, onDarkModeChange, onFontChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load Google Font when selected
  useEffect(() => {
    const name = GFONT_MAP[fontFamily];
    if (!name) return;
    const id = `gfont-${name}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${name}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        title="Reader Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-56 bg-card border border-border rounded-xl shadow-xl p-4 font-sans"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Reader Settings</p>

            {/* Dark mode */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-foreground font-medium">Dark Mode</span>
              <button
                role="switch"
                aria-checked={darkMode}
                onClick={() => onDarkModeChange(!darkMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`}
                />
              </button>
            </div>

            <hr className="border-border my-2" />

            {/* Font family */}
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Font Family</p>
            <select
              value={fontFamily}
              onChange={e => onFontChange(e.target.value)}
              className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:border-primary"
            >
              {FONTS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
