import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Trash2, BookOpen } from 'lucide-react';
import { ReaderFile } from '@/types/reader.types';
import { estimateReadingTime, getWordCount } from '@/engines/documentParser';

interface Props {
  file: ReaderFile;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function FileItem({ file, onOpen, onDelete, index }: Props) {
  const paragraphs = file.content.split('\n\n');
  const wordCount = getWordCount(paragraphs);
  const readTime = estimateReadingTime(wordCount);
  const progress = file.scrollDepth ? Math.round(file.scrollDepth * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card p-5 group cursor-pointer border-border/60 bg-card/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-all"
      onClick={() => onOpen(file.id)}
    >
      <div className="flex items-start gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-12 h-12 rounded-2xl gradient-coral flex items-center justify-center flex-shrink-0 shadow-md"
        >
          <FileText className="w-6 h-6 text-primary-foreground" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-base group-hover:text-primary transition-colors">
            {file.name}
          </h3>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {wordCount.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readTime} min
            </span>
          </div>
          {progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-primary">{progress}% read</p>
                <span className="text-[10px] text-muted-foreground font-medium">In progress</span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
