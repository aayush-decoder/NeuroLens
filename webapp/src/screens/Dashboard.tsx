import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, FileText, FolderOpen, LibraryBig, UploadCloud, ChevronLeft, Plus, FolderPlus } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useAuth } from '@/hooks/useAuth';
import UploadDropzone from '@/components/FileSystem/UploadDropzone';
import FileItem from '@/components/FileSystem/FileItem';
import DashboardLayout from '@/components/DashboardLayout';
import { processUploadedFile } from '@/lib/document-upload';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { files, folders, removeFile, addFolder, addFile, loadFromStorage } = useFileStore();
  const { user } = useAuth();
  const folderId = searchParams.get('folder') || null;
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;
    
    // Check if a file with the same name already exists
    const fileNameExists = files.some(f => f.name.toLowerCase() === trimmedName.toLowerCase());
    if (fileNameExists) {
      alert(`A file named "${trimmedName}" already exists. Please choose a different folder name.`);
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
    
    const validFiles = Array.from(e.target.files).filter(f =>
      f.name.endsWith('.txt') || f.name.endsWith('.md')
    );
    
    const rootFiles = files.filter(f => !f.folderId);
    const existingNames = {
      fileNames: rootFiles.map(f => f.name),
      folderNames: folders.map(f => f.name),
    };
    
    await Promise.all(validFiles.map((file) => processUploadedFile(file, null, addFile, existingNames)));
    e.target.value = '';
  };

  // Redirect to all files if currently viewing a folder that no longer exists
  useEffect(() => {
    if (folderId && !folders.find(f => f.id === folderId)) {
      router.push('/dashboard');
    }
  }, [folderId, folders, router]);



  const filteredFiles = folderId ? files.filter(f => f.folderId === folderId) : files.filter(f => !!f.folderId);
  const selectedFolder = folders.find(f => f.id === folderId);
  
  // Get top 10 most recently used files (from any folder) for suggested section
  const suggestedFiles = folderId ? [] : files
    .filter(f => !!f.folderId)
    .sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0))
    .slice(0, 10);

  const totalWords = files.reduce((sum, f) => sum + f.content.split(/\s+/).length, 0);

  return (
    <DashboardLayout title={selectedFolder ? selectedFolder.name : "Dashboard"}>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-8">
        {/* Decorative gradient blobs */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 h-80 w-80 rounded-full bg-orange-500/6 blur-3xl" />
        </div>

        {!selectedFolder && (
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
              {selectedFolder && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to dashboard
                </button>
              )}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                  {selectedFolder ? (
                    <>
                      <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        {selectedFolder.name}
                      </span>
                    </>
                  ) : user?.name ? (
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
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-blue text-primary-foreground shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 p-6">
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
              <motion.div whileHover={{ y: -4 }} className="stat-card gradient-emerald text-primary-foreground shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-5 h-5 opacity-90" />
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
        )}

        {/* Upload dropzone - only show when in a folder */}
        {selectedFolder && (
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
              <UploadDropzone folderId={folderId} />
          </div>
        </motion.section>
        )}

        {/* Folder & Upload section - only show in root */}
        {!selectedFolder && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card relative overflow-hidden p-8 sm:p-12 border border-border/60 bg-card/60 backdrop-blur-md"
          >
            <div className="absolute -top-20 -right-32 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-16 -left-24 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Organize & Upload</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Create Folder */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => setShowNewFolder(true)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderPlus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Create Folder</h3>
                      <p className="text-sm text-muted-foreground">Organize files into collections</p>
                    </div>
                  </div>
                </motion.div>

                {/* Upload Files */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <UploadCloud className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Upload Files</h3>
                      <p className="text-sm text-muted-foreground">Add .txt or .md files to root</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* New folder input */}
              {showNewFolder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
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
                        if (e.key === 'Escape') setShowNewFolder(false);
                      }}
                      placeholder="Enter folder name..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
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
        )}

        {/* Suggested files section - only show in root */}
        {!selectedFolder && suggestedFiles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card relative overflow-hidden p-8 sm:p-12 border border-border/60 bg-card/60 backdrop-blur-md"
          >
            <div className="absolute -top-20 -right-32 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-16 -left-24 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Suggested Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {suggestedFiles.map((file, i) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    index={i}
                    onOpen={(id) => router.push(`/read/${id}`)}
                    onDelete={removeFile}
                    allFiles={suggestedFiles}
                    folders={folders}
                    showingAllFiles={true}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        )}

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
              allFiles={filteredFiles}
              folders={folders}
              showingAllFiles={!folderId}
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
