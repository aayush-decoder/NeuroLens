import React, { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FolderOpen, Plus, Home, User, LogOut, Moon, Sun,
  ChevronRight, Trash2, Settings, FilePlus, File, ChevronDown, Upload
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useFileStore } from '@/store/fileStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { processUploadedFile } from '@/lib/document-upload';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { files, folders, theme, addFolder, addFile, removeFolder, removeFile, setTheme } = useFileStore();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const folderUploadInputRef = useRef<HTMLInputElement>(null);
  const rootUploadInputRef = useRef<HTMLInputElement>(null);

  const toggleFolderExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getChildFolders = (parentId: string | null | undefined) => {
    return folders.filter(f => f.parentFolderId === parentId);
  };

  const handleShowAllFiles = () => {
    router.push('/dashboard');
    window.dispatchEvent(new Event('adaptive-reader:show-all-files'));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

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
      parentFolderId: newFolderParentId,
    });
    setNewFolderName('');
    setNewFolderParentId(null);
    setShowNewFolder(false);
  };

  const isActive = (path: string) => pathname === path;

  const handleFolderAddFiles = (folderId: string | null) => {
    setUploadFolderId(folderId);
    folderUploadInputRef.current?.click();
  };

  const handleFolderFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadFolderId === undefined || !e.target.files?.length) return;

    try {
      const validFiles = Array.from(e.target.files).filter((f) => f.name.endsWith('.txt') || f.name.endsWith('.md'));
      const existingNames = {
        fileNames: files.map(f => f.name),
        folderNames: folders.map(f => f.name),
      };
      await Promise.all(validFiles.map((file) => processUploadedFile(file, uploadFolderId, addFile, existingNames)));
    } finally {
      e.target.value = '';
      setUploadFolderId(null);
    }
  };

  const handleRootFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const validFiles = Array.from(e.target.files).filter((f) => f.name.endsWith('.txt') || f.name.endsWith('.md'));
      const rootFiles = files.filter(f => !f.folderId);
      const existingNames = {
        fileNames: rootFiles.map(f => f.name),
        folderNames: folders.map(f => f.name),
      };
      await Promise.all(validFiles.map((file) => processUploadedFile(file, null, addFile, existingNames)));
    } finally {
      e.target.value = '';
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-teal-500/20 flex-shrink-0">
            <img src="/logo.png" alt="NeuroLens Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">NeuroLens</h1>
              <p className="text-[10px] text-muted-foreground">Focus Deeper. Learn Faster.</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <input
          ref={folderUploadInputRef}
          type="file"
          accept=".txt,.md"
          multiple
          className="hidden"
          onChange={handleFolderFileInputChange}
        />
        <input
          ref={rootUploadInputRef}
          type="file"
          accept=".txt,.md"
          multiple
          className="hidden"
          onChange={handleRootFileUpload}
        />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/dashboard')}
                  className={isActive('/dashboard') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                >
                  <Home className="w-4 h-4" />
                  {!collapsed && <span>Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/profile')}
                  className={isActive('/profile') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                >
                  <User className="w-4 h-4" />
                  {!collapsed && <span>Profile</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Folders */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between pr-2">
            <span>Folders</span>
            {!collapsed && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => rootUploadInputRef.current?.click()}
                  className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground"
                  title="Upload files to root"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* All files */}
              <SidebarMenuItem>
                <div className="flex items-center gap-1 group/folder">
                  <SidebarMenuButton
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 text-muted-foreground"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {!collapsed && (
                      <div className="flex items-center flex-1">
                        <span>Suggested Files</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                  {!collapsed && (
                    <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 relative">
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-max">
                        {files.filter(f => !!f.folderId).length}
                      </span>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              {/* Files in Suggested Files - not expandable, no uploads */}

              {folders.filter(f => !f.parentFolderId).map(folder => {
                const count = files.filter(f => f.folderId === folder.id).length;
                const folderFiles = files.filter(f => f.folderId === folder.id);
                const isExpanded = expandedFolders.has(folder.id);
                return (
                  <div key={folder.id}>
                    <SidebarMenuItem>
                      <div className="flex items-center gap-1 group/folder">
                        <button
                          onClick={() => toggleFolderExpand(folder.id)}
                          className="p-1 hover:bg-sidebar-accent rounded flex-shrink-0"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'
                              }`}
                          />
                        </button>
                        <SidebarMenuButton
                          onClick={() => router.push(`/dashboard?folder=${folder.id}`)}
                          className="flex-1 text-muted-foreground"
                        >
                          <FolderOpen className="w-4 h-4" style={{ color: folder.color || undefined }} />
                          {!collapsed && (
                            <div className="flex items-center flex-1 min-w-0">
                              <span className="truncate">{folder.name}</span>
                            </div>
                          )}
                        </SidebarMenuButton>
                        {!collapsed && (
                          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 relative w-20 pointer-events-none">
                            <button
                              onClick={() => handleFolderAddFiles(folder.id)}
                              className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-accent-foreground opacity-0 group-hover/folder:opacity-100 transition-opacity absolute right-6 pointer-events-auto"
                              aria-label={`Add files to folder ${folder.name}`}
                              title={`Add files to folder ${folder.name}`}
                            >
                              <FilePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFolder(folder.id)}
                              className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/folder:opacity-100 transition-opacity absolute right-0 pointer-events-auto"
                              aria-label={`Delete folder ${folder.name}`}
                              title={`Delete folder ${folder.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-max opacity-100 group-hover/folder:opacity-0 transition-opacity ml-auto">
                              {count}
                            </span>
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>

                    {/* Files under folder */}
                    {isExpanded && !collapsed && (
                      <SidebarMenu className="pl-6 border-l border-sidebar-border ml-3">
                        {folderFiles.map((file) => (
                          <SidebarMenuItem key={file.id}>
                            <div className="flex items-center gap-1 group/file">
                              <SidebarMenuButton
                                onClick={() => router.push(`/read/${file.id}`)}
                                className="flex-1 text-muted-foreground hover:text-foreground text-sm"
                              >
                                <File className="w-4 h-4" />
                                <span className="truncate text-xs">{file.name}</span>
                              </SidebarMenuButton>
                              <div className="flex items-center ml-auto flex-shrink-0 relative w-20">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                  className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/file:opacity-100 transition-opacity absolute right-3"
                                  aria-label={`Delete file ${file.name}`}
                                  title={`Delete file ${file.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </SidebarMenuItem>
                        ))}

                        {/* Child folders */}
                        {getChildFolders(folder.id).map((childFolder) => {
                          const childCount = files.filter(f => f.folderId === childFolder.id).length;
                          const isChildExpanded = expandedFolders.has(childFolder.id);

                          return (
                            <div key={childFolder.id}>
                              <SidebarMenuItem>
                                <div className="flex items-center gap-1 group/subfolder">
                                  <button
                                    onClick={() => toggleFolderExpand(childFolder.id)}
                                    className="p-1 hover:bg-sidebar-accent rounded flex-shrink-0"
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform ${isChildExpanded ? '' : '-rotate-90'
                                        }`}
                                    />
                                  </button>
                                  <SidebarMenuButton
                                    onClick={() => router.push(`/dashboard?folder=${childFolder.id}`)}
                                    className="flex-1 text-muted-foreground text-sm"
                                  >
                                    <FolderOpen className="w-4 h-4" style={{ color: childFolder.color || undefined }} />
                                    <span className="truncate text-xs">{childFolder.name}</span>
                                  </SidebarMenuButton>
                                  {!collapsed && (
                                    <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 relative w-16">
                                      <button
                                        onClick={() => handleFolderAddFiles(childFolder.id)}
                                        className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-accent-foreground opacity-0 group-hover/subfolder:opacity-100 transition-opacity absolute right-6 pointer-events-auto"
                                        aria-label={`Add files to ${childFolder.name}`}
                                        title={`Add files to ${childFolder.name}`}
                                      >
                                        <FilePlus className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeFolder(childFolder.id)}
                                        className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/subfolder:opacity-100 transition-opacity absolute right-0 pointer-events-auto"
                                        aria-label={`Delete ${childFolder.name}`}
                                        title={`Delete ${childFolder.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1 py-0.5 min-w-max opacity-100 group-hover/subfolder:opacity-0 transition-opacity">
                                        {childCount}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </SidebarMenuItem>
                            </div>
                          );
                        })}
                      </SidebarMenu>
                    )}
                  </div>
                );
              })}

              {/* New folder input */}
              {showNewFolder && !collapsed && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 flex gap-1">
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateFolder();
                        if (e.key === 'Escape') setShowNewFolder(false);
                      }}
                      onBlur={() => { if (!newFolderName) setShowNewFolder(false); }}
                      placeholder="Folder name..."
                      className="flex-1 text-xs px-2 py-1 rounded-md bg-sidebar-accent border border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-sidebar-ring"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground"
                    >
                      Add
                    </button>
                  </div>
                </SidebarMenuItem>
              )}

              {/* Root files */}
              {files.filter(f => !f.folderId).length > 0 && (
                <>
                  <SidebarMenuItem className="mt-2 px-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Root Files</div>
                  </SidebarMenuItem>
                  {files.filter(f => !f.folderId).map((file) => (
                    <SidebarMenuItem key={file.id}>
                      <div className="flex items-center gap-1 group/file">
                        <SidebarMenuButton
                          onClick={() => router.push(`/read/${file.id}`)}
                          className="flex-1 text-muted-foreground hover:text-foreground text-sm"
                        >
                          <File className="w-4 h-4" />
                          <span className="truncate text-xs">{file.name}</span>
                        </SidebarMenuButton>
                        <div className="flex items-center ml-auto flex-shrink-0 relative w-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                            className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/file:opacity-100 transition-opacity absolute right-3"
                            aria-label={`Delete file ${file.name}`}
                            title={`Delete file ${file.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground text-sm"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {!collapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {profile?.display_name || user.email}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
