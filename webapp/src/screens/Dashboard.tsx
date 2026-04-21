'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, FileText, LibraryBig,
  UploadCloud, FolderOpen, FolderPlus, ExternalLink, Loader2,
} from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useAuth } from '@/hooks/useAuth';
import UploadDropzone from '@/components/FileSystem/UploadDropzone';
import FileItem from '@/components/FileSystem/FileItem';
import DashboardLayout from '@/components/DashboardLayout';
import { API_ROUTES } from '@/lib/api';
import { processUploadedFile } from '@/lib/document-upload';
import type { S3Directory, S3FileEntry } from '@/types/files.types';

// Opens cloud file in reader mode via the stable /read/cloud/[dbId] route
function FileCard({ file, index }: { file: S3FileEntry; index: number }) {
  const router = useRouter();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      onClick={() => router.push(`/read/cloud/${file.id}`)}
      className="glass-card flex items-center gap-3 p-4 border border-border/60 bg-card/70 backdrop-blur-md hover:shadow-lg transition-all group text-left w-full"
    >
      <div className="w-9 h-9 rounded-xl gradient-coral flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(file.createdAt).toLocaleDateString()}
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </motion.button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { files, folders, removeFile, addFolder, addFile, loadFromStorage } = useFileStore();
  const { user } = useAuth();

  const [directories, setDirectories] = useState<S3Directory[]>([]);
  const [loadingDirs, setLoadingDirs] = useState(true);
  const [activeDir, setActiveDir] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const fetchDirectories = useCallback(async () => {
    setLoadingDirs(true);
    try {
      const res = await fetch(API_ROUTES.files, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { directories: S3Directory[] };
        setDirectories(data.directories);
      }
    } catch (e) {
      console.error('Failed to fetch directories', e);
    } finally {
      setLoadingDirs(false);
    }
  }, []);

  useEffect(() => { fetchDirectories(); }, [fetchDirectories]);

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;

    const existingFolder = folders.some(
      folder => folder.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingFolder) {
      alert(`A folder named "${trimmedName}" already exists.`);
      return;
    }

    addFolder({
      id: crypto.randomUUID(),
      name: trimmedName,
      color: '',
      createdAt: Date.now(),
    });

    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleRootFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const validFiles = Array.from(e.target.files).filter(
      file => file.name.endsWith('.txt') || file.name.endsWith('.md'),
    );

    await Promise.all(validFiles.map(file => processUploadedFile(file, null, addFile)));
    e.target.value = '';
  };

  const totalWords = files.reduce((sum, f) => sum + f.content.split(/\s+/).length, 0);
  const visibleDirs = activeDir ? directories.filter(d => d.name === activeDir) : directories;

  return (
    <DashboardLayout title="Dashboard">
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-8">

        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        </div>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
          <div className="relative space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              {user?.name ? (
                <>
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {user.name}
                  </span>
                </>
              ) : (
                <span
                  className="inline-block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                  style={{ WebkitTextFillColor: 'transparent' }}
                >
                  Your reading dashboard
                </span>
              )}
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Manage your documents with style. Beautiful library interface with adaptive reading sessions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-violet text-primary-foreground shadow-lg shadow-primary/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <LibraryBig className="w-5 h-5 opacity-90" />
                  <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Library</span>
                </div>
                <p className="text-5xl font-bold mb-2">{files.length}</p>
                <p className="text-xs opacity-75 font-medium">Local documents</p>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-coral text-primary-foreground shadow-lg shadow-red-500/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 opacity-90" />
                  <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Words</span>
                </div>
                <p className="text-5xl font-bold mb-2">{totalWords.toLocaleString()}</p>
                <p className="text-xs opacity-75 font-medium">Total loaded</p>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-emerald text-primary-foreground shadow-lg shadow-emerald-500/20 p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-5 h-5 opacity-90" />
                  <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Folders</span>
                </div>
                <p className="text-5xl font-bold mb-2">{folders.length}</p>
                <p className="text-xs opacity-75 font-medium">Collections</p>
              </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => document.getElementById('upload-dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:scale-105"
              >
                <UploadCloud className="h-5 w-5" />
                Upload documents
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-primary/10 hover:border-primary/40"
              >
                View profile <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Organize & Upload */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass-card relative overflow-hidden p-8 sm:p-12 border border-border/60 bg-card/60 backdrop-blur-md"
        >
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Organize & Upload</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all text-left"
                onClick={() => setShowNewFolder(true)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FolderPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Create Folder</h3>
                    <p className="text-sm text-muted-foreground">Build local collections for your session files</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all text-left"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <UploadCloud className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Quick Upload</h3>
                    <p className="text-sm text-muted-foreground">Add .txt or .md files directly to root</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {showNewFolder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg border border-primary/30 bg-primary/5"
              >
                <label className="block text-sm font-medium text-foreground mb-2">Folder name</label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') {
                        setShowNewFolder(false);
                        setNewFolderName('');
                      }
                    }}
                    placeholder="Enter folder name..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              multiple
              className="hidden"
              onChange={handleRootFileUpload}
            />
          </div>
        </motion.section>

        {/* Upload */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="upload-dropzone"
          className="glass-card relative overflow-hidden p-8 sm:p-12 border border-border/60 bg-card/60 backdrop-blur-md"
        >
          <div className="relative z-10">
            <UploadDropzone folderId={null} />
          </div>
        </motion.section>

        {/* S3 Directories */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Cloud Storage</h2>
            <div className="flex items-center gap-3">
              {activeDir && (
                <button
                  onClick={() => setActiveDir(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← All directories
                </button>
              )}
              <button
                onClick={fetchDirectories}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingDirs ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading directories…
            </div>
          ) : directories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No files uploaded yet. Upload a document to get started.
            </p>
          ) : (
            <div className="space-y-6">
              {!activeDir && (
                <div className="flex flex-wrap gap-2">
                  {directories.map(dir => (
                    <button
                      key={dir.name}
                      onClick={() => setActiveDir(dir.name)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      {dir.name}
                      <span className="ml-1 text-muted-foreground">({dir.files.length})</span>
                    </button>
                  ))}
                </div>
              )}

              {visibleDirs.map(dir => (
                <div key={dir.name} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{dir.name}</h3>
                    <span className="text-xs text-muted-foreground">({dir.files.length} files)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dir.files.map((file, i) => (
                      <FileCard key={file.id} file={file} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Local session files */}
        {files.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Local Session Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {files.map((file, i) => (
                <FileItem
                  key={file.id}
                  file={file}
                  index={i}
                  onOpen={(id) => router.push(`/read/${id}`)}
                  onDelete={removeFile}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {files.length === 0 && directories.length === 0 && !loadingDirs && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl glass-card bg-card/70 p-12 md:p-20 text-center border border-border/60"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                <FileText className="w-12 h-12 text-primary-foreground/90" />
              </div>
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No documents yet</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Upload a .txt or .md file to begin your adaptive reading experience.
            </p>
            <button
              onClick={() => document.getElementById('upload-dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:scale-105"
            >
              <UploadCloud className="h-5 w-5" />
              Upload your first document
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
