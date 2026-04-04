import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles, FolderPlus, Upload, FileText } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import UploadDropzone from '@/components/FileSystem/UploadDropzone';
import FileItem from '@/components/FileSystem/FileItem';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const router = useRouter();
  const { files, folders, removeFile, loadFromStorage } = useFileStore();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const handleShowAllFiles = () => setSelectedFolder(null);
    window.addEventListener('adaptive-reader:show-all-files', handleShowAllFiles);
    return () => window.removeEventListener('adaptive-reader:show-all-files', handleShowAllFiles);
  }, []);

  const filteredFiles = selectedFolder
    ? files.filter(f => f.folderId === selectedFolder)
    : files;

  const totalWords = files.reduce((sum, f) => sum + f.content.split(/\s+/).length, 0);

  return (
    <DashboardLayout>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="stat-card gradient-violet text-primary-foreground">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium opacity-80">Library</span>
              </div>
              <p className="text-3xl font-bold">{files.length}</p>
              <p className="text-xs opacity-70 mt-0.5">Documents</p>
            </div>
          </div>
          <div className="stat-card gradient-coral text-primary-foreground">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-medium opacity-80">Words</span>
              </div>
              <p className="text-3xl font-bold">{totalWords.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-0.5">Total loaded</p>
            </div>
          </div>
          <div className="stat-card gradient-teal text-primary-foreground">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <FolderPlus className="w-4 h-4" />
                <span className="text-xs font-medium opacity-80">Folders</span>
              </div>
              <p className="text-3xl font-bold">{folders.length}</p>
              <p className="text-xs opacity-70 mt-0.5">Collections</p>
            </div>
          </div>
        </motion.div>

        {/* Folder filter pills */}
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFolder === null
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Files
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFolder === folder.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>
        )}

        {/* Upload dropzone */}
        <UploadDropzone folderId={selectedFolder} />

        {/* File grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFiles.map((file, i) => (
            <FileItem
              key={file.id}
              file={file}
              index={i}
              onOpen={(id) => router.push(`/read/${id}`)}
              onDelete={removeFile}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredFiles.length === 0 && files.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 rounded-3xl gradient-violet/20 flex items-center justify-center mx-auto">
                <FileText className="w-10 h-10 text-primary/40" />
              </div>
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No documents yet</h3>
            <p className="text-muted-foreground">Drop a .txt or .md file above to get started</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
