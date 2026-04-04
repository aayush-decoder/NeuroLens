import { create } from 'zustand';
import { ReaderFile, Folder, SessionTelemetry, StruggledTerm } from '@/types/reader.types';
import { saveFiles, loadFiles, saveFolders, loadFolders } from '@/engines/persistenceEngine';

interface FileStore {
  files: ReaderFile[];
  folders: Folder[];
  currentSession: SessionTelemetry | null;
  theme: 'light' | 'dark';

  addFile: (file: ReaderFile) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<ReaderFile>) => void;
  addFolder: (folder: Folder) => void;
  removeFolder: (id: string) => void;
  setCurrentSession: (session: SessionTelemetry | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  loadFromStorage: () => void;
}

const FOLDER_COLORS = ['hsl(168, 60%, 40%)', 'hsl(14, 80%, 62%)', 'hsl(262, 60%, 62%)', 'hsl(38, 92%, 60%)', 'hsl(200, 80%, 55%)'];

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  folders: [],
  currentSession: null,
  theme: 'light',

  addFile: (file) => {
    const files = [...get().files, file];
    set({ files });
    saveFiles(files);
  },

  removeFile: (id) => {
    const files = get().files.filter(f => f.id !== id);
    set({ files });
    saveFiles(files);
  },

  updateFile: (id, updates) => {
    const files = get().files.map(f => f.id === id ? { ...f, ...updates } : f);
    set({ files });
    saveFiles(files);
  },

  addFolder: (folder) => {
    const folders = [...get().folders, { ...folder, color: FOLDER_COLORS[get().folders.length % FOLDER_COLORS.length] }];
    set({ folders });
    saveFolders(folders);
  },

  removeFolder: (id) => {
    const allDescendantIds = new Set<string>();
    const collectDescendants = (folderId: string) => {
      allDescendantIds.add(folderId);
      get().folders.filter(f => f.parentFolderId === folderId).forEach(f => collectDescendants(f.id));
    };
    collectDescendants(id);
    
    const folders = get().folders.filter(f => !allDescendantIds.has(f.id));
    const files = get().files.map(f => allDescendantIds.has(f.folderId as string) ? { ...f, folderId: null } : f);
    set({ folders, files });
    saveFolders(folders);
    saveFiles(files);
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('adaptive-reader:theme', theme);
  },

  loadFromStorage: () => {
    const files = loadFiles();
    const folders = loadFolders();
    const theme = (localStorage.getItem('adaptive-reader:theme') as 'light' | 'dark') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    set({ files, folders, theme });
  },
}));
