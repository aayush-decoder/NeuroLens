import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, BookOpen, ArrowLeft } from 'lucide-react';
import { StruggledTerm, ParagraphTelemetry } from '@/types/reader.types';

interface Props {
  terms: StruggledTerm[];
  paragraphs: ParagraphTelemetry[];
  fileName: string;
  onBack: () => void;
}

export default function ConceptGraph({ terms, paragraphs, fileName, onBack }: Props) {
  const frictionParagraphs = useMemo(() =>
    paragraphs.filter(p => p.frictionScore > 0.4).sort((a, b) => b.frictionScore - a.frictionScore),
    [paragraphs]
  );

  const uniqueTerms = useMemo(() => {
    const seen = new Set<string>();
    return terms.filter(t => {
      if (seen.has(t.word)) return false;
      seen.add(t.word);
      return true;
    }).sort((a, b) => b.frictionScore - a.frictionScore);
  }, [terms]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Session Review</h1>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-8 mb-8">
          <div className="dashboard-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{paragraphs.length}</p>
            <p className="text-xs text-muted-foreground">Paragraphs Read</p>
          </div>
          <div className="dashboard-card p-4 text-center">
            <p className="text-2xl font-bold text-coral">{frictionParagraphs.length}</p>
            <p className="text-xs text-muted-foreground">Challenging Sections</p>
          </div>
          <div className="dashboard-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{uniqueTerms.length}</p>
            <p className="text-xs text-muted-foreground">Terms to Review</p>
          </div>
        </div>

        {/* Struggled Terms */}
        {uniqueTerms.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Terms to Review</h2>
            {uniqueTerms.map((term, i) => (
              <motion.div
                key={term.word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="dashboard-card p-4 flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `hsl(${term.frictionScore > 0.7 ? '0, 84%, 60%' : '38, 92%, 60%'} / 0.15)`,
                    }}
                  >
                    <AlertTriangle
                      className="w-4 h-4"
                      style={{
                        color: `hsl(${term.frictionScore > 0.7 ? '0, 84%, 60%' : '38, 92%, 60%'})`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-serif font-bold text-foreground">{term.word}</p>
                  <p className="text-xs text-muted-foreground">Paragraph {term.paragraphIndex + 1}</p>
                </div>
                <div className="text-right">
                  <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${term.frictionScore * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round(term.frictionScore * 100)}% friction
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Great job! No significant friction detected.</p>
            <p className="text-sm text-muted-foreground mt-1">Try reading more to generate review data.</p>
          </div>
        )}

        {/* Friction Heatmap */}
        {frictionParagraphs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Reading Friction Map
            </h2>
            <div className="flex flex-wrap gap-1">
              {paragraphs.map((p, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-sm transition-colors"
                  style={{
                    backgroundColor: `hsl(168, 60%, 40% / ${Math.max(0.05, p.frictionScore)})`,
                  }}
                  title={`P${p.paragraphIndex + 1}: ${Math.round(p.frictionScore * 100)}% friction`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Each block = one paragraph. Darker = more friction.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
