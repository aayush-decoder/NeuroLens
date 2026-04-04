import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Sparkles, FolderPlus, FileText, LibraryBig, UploadCloud } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useAuth } from '@/hooks/useAuth';
import UploadDropzone from '@/components/FileSystem/UploadDropzone';
import FileItem from '@/components/FileSystem/FileItem';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const router = useRouter();
  const { files, folders, removeFile, loadFromStorage } = useFileStore();
  const { user } = useAuth();
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
    <DashboardLayout title="Dashboard">
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-8">
        {/* Decorative gradient blobs */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] p-6 sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
          <div className="absolute -top-20 -right-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative space-y-8">
            {/* Top content - Text only */}
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                  {user?.name ? (
                    <>
                      Welcome back,{' '}
                      <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        {user.name}
                      </span>
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Your reading dashboard
                    </span>
                  )}
                </h1>
                <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Manage your documents with style. Beautiful library interface with adaptive reading sessions.
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {/* Library Card */}
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-violet text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <LibraryBig className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Library</span>
                  </div>
                  <p className="text-5xl font-bold mb-2">{files.length}</p>
                  <p className="text-xs opacity-75 font-medium">Documents</p>
                </div>
              </motion.div>

              {/* Words Card */}
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-coral text-primary-foreground shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Words</span>
                  </div>
                  <p className="text-5xl font-bold mb-2">{totalWords.toLocaleString()}</p>
                  <p className="text-xs opacity-75 font-medium">Total loaded</p>
                </div>
              </motion.div>

              {/* Folders Card */}
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-teal text-primary-foreground shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderPlus className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Folders</span>
                  </div>
                  <p className="text-5xl font-bold mb-2">{folders.length}</p>
                  <p className="text-xs opacity-75 font-medium">Collections</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Buttons - Below stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={() => document.getElementById('upload-dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
              >
                <UploadCloud className="h-5 w-5" />
                Upload documents
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-primary/10 hover:border-primary/40"
              >
                View profile
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Folder filter pills */}
        {folders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => setSelectedFolder(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
                selectedFolder === null
                  ? 'bg-gradient-to-r from-primary to-primary/85 text-primary-foreground border-primary shadow-lg shadow-primary/30'
                  : 'bg-background/50 text-muted-foreground border-border/40 hover:bg-primary/8 hover:border-primary/30'
              }`}
            >
              All Files
            </motion.button>
            {folders.map((folder, idx) => (
              <motion.button
                key={folder.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                onClick={() => setSelectedFolder(folder.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
                  selectedFolder === folder.id
                    ? 'bg-gradient-to-r from-secondary to-secondary/85 text-primary-foreground border-secondary shadow-lg shadow-secondary/30'
                    : 'bg-background/50 text-muted-foreground border-border/40 hover:bg-secondary/8 hover:border-secondary/30'
                }`}
              >
                {folder.name}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Upload dropzone */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          id="upload-dropzone"
          className="glass-card relative overflow-hidden p-8 sm:p-12 py-12 sm:py-16 border border-border/60 bg-card/60 backdrop-blur-md"
        >
          <div className="absolute -top-20 -right-32 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-16 -left-24 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />
          <div className="relative z-10">
            <UploadDropzone folderId={selectedFolder} />
          </div>
        </motion.section>

        {/* File grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredFiles.map((file, i) => (
            <FileItem
              key={file.id}
              file={file}
              index={i}
              onOpen={(id) => router.push(`/read/${id}`)}
              onDelete={removeFile}
            />
          ))}
        </motion.div>

        {/* Empty state */}
        {filteredFiles.length === 0 && files.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl glass-card bg-card/70 p-12 md:p-20 text-center border border-border/60"
          >
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative z-10 inline-block mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                <FileText className="w-12 h-12 text-primary-foreground/90" />
              </div>
            </motion.div>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-foreground mb-3">No documents yet</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                Start by uploading a document to begin your adaptive reading experience. Drop a .txt or .md file to get started.
              </p>
              <button
                onClick={() => document.getElementById('upload-dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
              >
                <UploadCloud className="h-5 w-5" />
                Upload your first document
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
