import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Trash2 } from 'lucide-react';
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
      className="dashboard-card p-4 group cursor-pointer"
      onClick={() => onOpen(file.id)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-coral flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{file.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readTime} min
            </span>
          </div>
          {progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{progress}% read</p>
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
