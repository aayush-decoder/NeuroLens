import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { processUploadedFile } from '@/lib/document-upload';

interface Props {
  folderId: string | null;
}

export default function UploadDropzone({ folderId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFile = useFileStore(s => s.addFile);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const validFiles = Array.from(files).filter(f =>
        f.name.endsWith('.txt') || f.name.endsWith('.md')
      );
      await Promise.all(validFiles.map((file) => processUploadedFile(file, folderId, addFile)));
    } finally {
      setUploading(false);
    }
  }, [folderId, addFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/50 bg-card'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
          className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center"
        >
          <Upload className="w-6 h-6 text-primary-foreground" />
        </motion.div>
        <div>
          <p className="font-medium text-foreground">
            {uploading ? 'Processing...' : 'Drop your .txt or .md files here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Files are cleaned and stripped of formatting automatically
          </p>
        </div>
      </div>
    </motion.div>
  );
}
