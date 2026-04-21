'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Trash2, BookOpen, AlertTriangle, X } from 'lucide-react';
import { ReaderFile } from '@/types/reader.types';
import { estimateReadingTime, getWordCount } from '@/engines/documentParser';
import { deleteFileSessionData } from '@/engines/persistenceEngine';

interface Props {
  file: ReaderFile;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function FileItem({ file, onOpen, onDelete, index }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const paragraphs = file.content.split('\n\n');
  const wordCount = getWordCount(paragraphs);
  const readTime = estimateReadingTime(wordCount);
  const progress = file.scrollDepth ? Math.round(file.scrollDepth * 100) : 0;

  const handleConfirmDelete = () => {
    // Delete session data from localStorage
    deleteFileSessionData(file.id);
    // Remove file from store
    onDelete(file.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
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
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex-shrink-0"
            title="Delete file and session data"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border/60 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Delete file?</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  This will permanently delete "{file.name}" and all its reading session data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-foreground font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
