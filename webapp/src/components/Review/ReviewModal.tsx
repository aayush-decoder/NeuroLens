'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import InteractiveConceptMap from './InteractiveConceptMap';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReviewItem {
  term: string;
  definition: string;
  esl_equiv?: string;
  source_paragraph_index: number;
}

interface StruggledPara {
  index: number;
  text: string;
  dwell_ms: number;
  rescroll_count: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onDestroyReader: () => void;
  sessionId: string;
  struggledParagraphs: StruggledPara[];
  language?: string | null;
  backendBase: string;
  token: string | null;
  /** Hard words annotated during session: { word, category } */
  glossedWords: string[];
  fileName: string;
  /** Incremental concept map categories from LLM */
  conceptMapCategories?: Record<string, string[]>;
  /** Incremental concept map words (word -> paragraph indices) */
  conceptMapWords?: Record<string, number[]>;
}

// ── Word categories (expanded fallback) ───────────────────────────────────────
const WORD_CATEGORIES: Record<string, string[]> = {
  Political:      ['sovereignty','diplomatic','unilateral','assertions','rhetoric','sanctions','bureaucracy','intervention','jurisdiction','arbitration','governance','policy','democracy','legislation'],
  Military:       ['paramilitary','militia','guerilla','combat','casualties','insurgency','armistice','militarization','espionage','retaliation','warfare','defense','battalion','strategic'],
  Geographic:     ['archipelago','coastal','maritime','oceanic','navigation','reclamation','annexed','disputed','transnational','occupation','terrain','topography','peninsula','continental','territorial'],
  Humanitarian:   ['misery','harassment','intimidated','adversity','vulnerability','resilience','displacement','oblivion','detention','precarious','refugee','asylum','persecution','suffering'],
  Legal:          ['extrajudicial','impunity','jurisdiction','insubordination','penalized','infringement','deterrent','obstruction','deterrence','coercion','litigation','statute','constitutional','judicial'],
  Economic:       ['commerce','trade','fiscal','monetary','investment','capital','revenue','expenditure','inflation','recession','prosperity','subsidy','tariff','commodity','market','financial'],
  Scientific:     ['hypothesis','empirical','methodology','analysis','synthesis','theoretical','experimental','quantitative','qualitative','research','innovation','discovery','paradigm','phenomenon'],
  Social:         ['community','societal','cultural','demographic','ethnicity','diversity','inclusion','inequality','stratification','cohesion','integration','marginalization','solidarity'],
  Environmental:  ['ecosystem','biodiversity','sustainability','conservation','pollution','deforestation','renewable','climate','ecological','habitat','endangered','preservation'],
  Medical:        ['diagnosis','treatment','therapeutic','pathology','syndrome','epidemic','pandemic','vaccination','pharmaceutical','clinical','prognosis','symptom'],
  Educational:    ['pedagogy','curriculum','literacy','academia','scholarship','tuition','enrollment','graduation','accreditation','certification'],
  Technological:  ['digital','algorithm','automation','artificial','intelligence','computing','software','hardware','innovation','cybersecurity','infrastructure'],
  Cultural:       ['heritage','tradition','customs','folklore','ritual','ceremony','artistic','aesthetic','indigenous','multicultural'],
  Historical:     ['chronological','archival','legacy','antiquity','medieval','colonial','revolutionary','contemporary','prehistoric'],
  Philosophical:  ['ethics','morality','metaphysical','epistemology','ontology','existential','ideology','doctrine','principle'],
};

const CATEGORY_COLORS: Record<string, string> = {
  Political:      '#5c6bc0',  // Indigo
  Military:       '#e53935',  // Red
  Geographic:     '#00897b',  // Teal
  Humanitarian:   '#f57c00',  // Orange
  Legal:          '#8e24aa',  // Purple
  Economic:       '#43a047',  // Green
  Scientific:     '#1e88e5',  // Blue
  Social:         '#d81b60',  // Pink
  Environmental:  '#7cb342',  // Light Green
  Medical:        '#e91e63',  // Deep Pink
  Educational:    '#3949ab',  // Deep Blue
  Technological:  '#00acc1',  // Cyan
  Cultural:       '#fb8c00',  // Deep Orange
  Historical:     '#6d4c41',  // Brown
  Philosophical:  '#5e35b1',  // Deep Purple
  Other:          '#78909c',  // Blue Grey
};

// ── Concept Graph (SVG) ───────────────────────────────────────────────────────
function ConceptGraphSVG({ 
  words, 
  categories,
  isFullscreen = false,
}: { 
  words: string[];
  categories?: Record<string, string[]>;
  isFullscreen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');

  useEffect(() => {
    // Use incremental categories if available, otherwise fall back to hardcoded
    const wordsByCategory: Record<string, string[]> = categories && Object.keys(categories).length > 0
      ? { ...categories }
      : {};

    // If no incremental categories, use hardcoded fallback
    if (Object.keys(wordsByCategory).length === 0) {
      Object.keys(WORD_CATEGORIES).forEach(c => { wordsByCategory[c] = []; });
      wordsByCategory['Other'] = [];

      words.forEach(w => {
        let found = false;
        for (const cat of Object.keys(WORD_CATEGORIES)) {
          if (WORD_CATEGORIES[cat].includes(w.toLowerCase())) {
            wordsByCategory[cat].push(w);
            found = true;
            break;
          }
        }
        if (!found) wordsByCategory['Other'].push(w);
      });
    }

    const cats = Object.keys(wordsByCategory).filter(c => wordsByCategory[c].length > 0);
    
    if (cats.length === 0) {
      setSvg('');
      return;
    }

    // Adjust dimensions based on fullscreen mode
    const W = isFullscreen ? (ref.current?.offsetWidth || 1200) : (ref.current?.offsetWidth || 520);
    const H = isFullscreen ? (ref.current?.offsetHeight || 800) : 380;
    const cx = W / 2, cy = H / 2;

    const lines: string[] = [], nodes: string[] = [], labels: string[] = [];

    // Adjust sizes for fullscreen
    const hubR = Math.min(W, H) * (isFullscreen ? 0.22 : 0.27);
    const categoryNodeR = isFullscreen ? 32 : 26;
    const wordNodeR = isFullscreen ? 20 : 16;
    const wordDistance = isFullscreen ? 120 : 88;
    const categoryFontSize = isFullscreen ? 11 : 9;
    const wordFontSize = isFullscreen ? 10 : 8.5;

    cats.forEach((cat, ci) => {
      const color = CATEGORY_COLORS[cat] || '#78909c';
      const angle = (2 * Math.PI * ci / cats.length) - Math.PI / 2;
      const hx = cx + hubR * Math.cos(angle);
      const hy = cy + hubR * Math.sin(angle);

      nodes.push(`<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${categoryNodeR}" fill="${color}" opacity="0.9"/>`);
      labels.push(`<text x="${hx.toFixed(1)}" y="${(hy + 4).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="${categoryFontSize}" font-weight="700" font-family="sans-serif">${cat}</text>`);
      lines.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`);

      wordsByCategory[cat].forEach((word, wi) => {
        const wCount = wordsByCategory[cat].length;
        const wAngle = angle + (2 * Math.PI * (wi - (wCount - 1) / 2) / Math.max(wCount, 1)) * 0.45;
        let wx = hx + wordDistance * Math.cos(wAngle);
        let wy = hy + wordDistance * Math.sin(wAngle);
        wx = Math.max(36, Math.min(W - 36, wx));
        wy = Math.max(14, Math.min(H - 14, wy));

        lines.push(`<line x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${wx.toFixed(1)}" y2="${wy.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.4"/>`);
        nodes.push(`<circle cx="${wx.toFixed(1)}" cy="${wy.toFixed(1)}" r="${wordNodeR}" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="1.2"/>`);
        labels.push(`<text x="${wx.toFixed(1)}" y="${(wy + 4).toFixed(1)}" text-anchor="middle" fill="${color}" font-size="${wordFontSize}" font-weight="600" font-family="sans-serif">${word.charAt(0).toUpperCase() + word.slice(1)}</text>`);
      });
    });

    const centerNodeR = isFullscreen ? 26 : 20;
    const centerFontSize = isFullscreen ? 10 : 8;
    nodes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${centerNodeR}" fill="#37474f"/>`);
    labels.push(`<text x="${cx.toFixed(1)}" y="${(cy - 2).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="${centerFontSize}" font-weight="700" font-family="sans-serif">Hard</text>`);
    labels.push(`<text x="${cx.toFixed(1)}" y="${(cy + 9).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="${centerFontSize}" font-weight="700" font-family="sans-serif">Words</text>`);

    setSvg(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${lines.join('')}${nodes.join('')}${labels.join('')}</svg>`);
  }, [words, categories, isFullscreen]);

  if (!svg) {
    return <p className="text-center text-muted-foreground text-sm py-10">No hard words annotated this session.</p>;
  }

  return <div ref={ref} className={`w-full rounded-lg bg-muted/30 border border-border overflow-hidden ${isFullscreen ? 'h-full' : ''}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Revision Sheet (static markdown-like content) ────────────────────────────
function RevisionSheet({ items, struggledParagraphs }: { items: ReviewItem[]; struggledParagraphs: StruggledPara[] }) {
  if (!items.length && !struggledParagraphs.length) {
    return <p className="text-muted-foreground text-sm">No review items yet.</p>;
  }

  // Group items by category
  const categorized: Record<string, ReviewItem[]> = {};
  items.forEach(item => {
    const category = 'Key Terms';
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Study Tips Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">📚 Study Tips</h3>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Review these terms regularly to improve retention</li>
          <li>• Create flashcards for terms you struggle with</li>
          <li>• Try using these words in your own sentences</li>
          <li>• Focus on paragraphs marked as difficult</li>
        </ul>
      </div>

      {/* Categorized Review Items */}
      {Object.entries(categorized).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="font-semibold text-foreground text-sm mb-3 pb-2 border-b border-border">{category}</h3>
          <div className="space-y-3">
            {categoryItems.map((item, i) => (
              <div key={i} className="bg-muted/40 border border-border rounded-lg p-3 hover:bg-muted/60 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold text-lg min-w-fit">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="font-semibold text-primary text-sm">{item.term}</p>
                    <p className="text-sm text-foreground mt-1.5">{item.definition}</p>
                    {item.esl_equiv && (
                      <p className="text-xs text-pink-500 mt-1.5 italic">
                        💡 Simpler meaning: {item.esl_equiv}
                      </p>
                    )}
                    {item.source_paragraph_index >= 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Found in paragraph {item.source_paragraph_index + 1}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Struggled Paragraphs Summary */}
      {struggledParagraphs.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-3">⚠️ Challenging Paragraphs</h3>
          <div className="space-y-2 text-xs text-orange-800 dark:text-orange-200">
            {struggledParagraphs.slice(0, 5).map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-bold min-w-fit">Para {para.index + 1}:</span>
                <div className="flex-1">
                  <p className="truncate">{para.text.substring(0, 60)}...</p>
                  <p className="text-[10px] text-orange-700 dark:text-orange-300 mt-0.5">
                    ⏱️ {(para.dwell_ms / 1000).toFixed(1)}s dwell • {para.rescroll_count} rescrolls
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print-friendly notice */}
      <div className="text-xs text-muted-foreground text-center py-4 border-t border-border">
        <p>💾 You can save this page (Ctrl+S or Cmd+S) for offline study</p>
      </div>
    </div>
  );
}

// ── Generate fallback review items from struggled paragraphs ────────────────
function generateReviewItemsFallback(struggledParagraphs: StruggledPara[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  const seenTerms = new Set<string>();

  console.log('[ReviewModal Fallback] Starting generation from', struggledParagraphs.length, 'paragraphs');

  if (!struggledParagraphs.length) {
    console.log('[ReviewModal Fallback] No paragraphs provided');
    return [];
  }

  // Simple word extraction from all paragraphs
  for (const para of struggledParagraphs) {
    if (items.length >= 15) break;
    
    // Extract all words - simple split
    const words = para.text.split(/[\s\-\.,"';:!?()\[\]]+/).filter(w => w && w.length > 2);
    console.log(`[ReviewModal Fallback] Para ${para.index}: extracted ${words.length} words`);
    
    for (const word of words) {
      if (items.length >= 15) break;
      
      const lower = word.toLowerCase();
      if (seenTerms.has(lower) || lower.length < 3 || lower.length > 30) continue;
      
      seenTerms.add(lower);
      
      // Check category
      let category = 'Other';
      for (const [cat, words] of Object.entries(WORD_CATEGORIES)) {
        if (words.includes(lower)) {
          category = cat;
          break;
        }
      }
      
      items.push({
        term: word,
        definition: `A ${category.toLowerCase()} term from your reading`,
        source_paragraph_index: para.index,
      });
      
      console.log(`[ReviewModal Fallback] Added: "${word}" (${category})`);
    }
  }

  console.log('[ReviewModal Fallback] Generated', items.length, 'total items');
  return items;
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ReviewModal({
  open, onClose, onDestroyReader,
  sessionId, struggledParagraphs, language,
  backendBase, token, glossedWords, fileName,
  conceptMapCategories, conceptMapWords,
}: Props) {
  const [tab, setTab] = useState<'ai' | 'graph' | 'revision'>('ai');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!open || !struggledParagraphs.length) return;
    setLoading(true);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('[ReviewModal] Fetching review from:', `${backendBase}/api/review`);
    console.log('[ReviewModal] Struggled paragraphs count:', struggledParagraphs.length);

    fetch(`${backendBase}/api/review`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        paragraphs: struggledParagraphs,
        language: language || null,
      }),
    })
      .then(r => {
        console.log('[ReviewModal] Response status:', r.status);
        return r.json();
      })
      .then(d => {
        console.log('[ReviewModal] Received data:', d);
        console.log('[ReviewModal] Items count:', d.items?.length || 0);
        
        // If backend returns data, use it; otherwise fall back
        if (d.items && d.items.length > 0) {
          setItems(d.items);
        } else {
          console.log('[ReviewModal] No items from backend, using fallback');
          setItems(generateReviewItemsFallback(struggledParagraphs));
        }
      })
      .catch((err) => {
        console.error('[ReviewModal] Fetch error:', err);
        console.log('[ReviewModal] Using fallback items generation');
        setItems(generateReviewItemsFallback(struggledParagraphs));
      })
      .finally(() => setLoading(false));
  }, [open, backendBase, token, sessionId, struggledParagraphs, language]);

  const TABS = [
    { id: 'ai' as const, label: 'Smart Review' },
    { id: 'graph' as const, label: 'Concept Map' },
    { id: 'revision' as const, label: 'Revision Sheet' },
  ];

  // Log concept map data for debugging
  useEffect(() => {
    if (open && conceptMapCategories) {
      console.log('[ReviewModal] Concept map categories:', conceptMapCategories);
      console.log('[ReviewModal] Total categories:', Object.keys(conceptMapCategories).length);
      console.log('[ReviewModal] Total words:', Object.values(conceptMapCategories).flat().length);
    }
  }, [open, conceptMapCategories]);

  // Reset fullscreen when modal closes or tab changes
  useEffect(() => {
    if (!open || tab !== 'graph') {
      setIsFullscreen(false);
    }
  }, [open, tab]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={e => { if (e.target === e.currentTarget && !isFullscreen) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`bg-card border border-border rounded-2xl p-8 shadow-2xl ${
              isFullscreen 
                ? 'w-[95vw] h-[95vh] max-w-none max-h-none' 
                : 'w-full max-w-lg max-h-[80vh] overflow-y-auto'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Session Review</h2>
              <div className="flex items-center gap-2">
                {/* Fullscreen toggle - only show on graph tab */}
                {tab === 'graph' && (
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-5 border-b border-border mb-5">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content area with conditional overflow */}
            <div className={isFullscreen && tab === 'graph' ? 'h-[calc(95vh-180px)] overflow-hidden' : ''}>
              {/* Tab: Smart Review */}
              {tab === 'ai' && (
                <div>
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                      <p className="text-muted-foreground text-sm">Generating your Smart Review...</p>
                    </div>
                  )}
                  {!loading && !items.length && !struggledParagraphs.length && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground text-sm mb-2">No struggled paragraphs detected.</p>
                      <p className="text-muted-foreground text-xs">Keep reading to build your review!</p>
                    </div>
                  )}
                  {!loading && items.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">✨ Key Insights</h3>
                        <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                          <li>• Found <strong>{items.length}</strong> challenging terms during your reading</li>
                          <li>• {struggledParagraphs.length} paragraphs marked as difficult</li>
                          <li>• Review these terms to improve comprehension</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground text-sm">Challenging Terms</h3>
                        <div className="space-y-2">
                          {items.map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-primary text-sm">{item.term}</p>
                                  <p className="text-sm text-foreground mt-1">{item.definition}</p>
                                  {item.esl_equiv && (
                                    <p className="text-xs text-pink-500 mt-1.5 italic">
                                      Simpler: {item.esl_equiv}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground font-medium min-w-fit">
                                  Para {item.source_paragraph_index + 1}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {!loading && !items.length && struggledParagraphs.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-blue-900 dark:text-blue-100 text-sm font-medium mb-1">📚 Terms from Your Reading</p>
                      <p className="text-blue-800 dark:text-blue-200 text-xs mb-4">Unable to load advanced review. Check your Revision Sheet and Concept Map below for your session details.</p>
                      <button
                        onClick={() => setTab('revision')}
                        className="text-xs bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-100 px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Go to Revision Sheet →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Concept Map */}
              {tab === 'graph' && (
                <InteractiveConceptMap 
                  categories={conceptMapCategories || {}} 
                  words={conceptMapWords || {}}
                  isFullscreen={isFullscreen}
                />
              )}

              {/* Tab: Revision Sheet */}
              {tab === 'revision' && <RevisionSheet items={items} struggledParagraphs={struggledParagraphs} />}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onDestroyReader}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                End &amp; Close Reader
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
