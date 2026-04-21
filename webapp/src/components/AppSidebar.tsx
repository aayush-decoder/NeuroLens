'use client';

import React, { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderOpen, Plus, Home, User, LogOut, Moon, Sun,
  Trash2, FilePlus, File, ChevronDown, Cloud, Loader2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useFileStore } from '@/store/fileStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCloudFiles } from '@/hooks/useCloudFiles';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { processUploadedFile } from '@/lib/document-upload';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { files, folders, theme, addFolder, addFile, removeFolder, setTheme } = useFileStore();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { directories: cloudDirs, loading: cloudLoading } = useCloudFiles();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState<string | null | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedCloudDirs, setExpandedCloudDirs] = useState<Set<string>>(new Set());
  const folderUploadInputRef = useRef<HTMLInputElement>(null);

  const toggleFolderExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder({
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      color: '',
      createdAt: Date.now(),
    });
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const isActive = (path: string) => pathname === path;

  // Open a cloud file in read mode via the stable /read/cloud/[dbId] route
  const openCloudFile = (fileId: string) => {
    router.push(`/read/cloud/${fileId}`);
  };

  const handleFolderAddFiles = (folderId: string | null) => {
    setUploadFolderId(folderId);
    folderUploadInputRef.current?.click();
  };

  const handleFolderFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadFolderId === undefined || !e.target.files?.length) return;

    try {
      const validFiles = Array.from(e.target.files).filter((f) => f.name.endsWith('.txt') || f.name.endsWith('.md'));
      await Promise.all(validFiles.map((file) => processUploadedFile(file, uploadFolderId, addFile)));
    } finally {
      e.target.value = '';
      setUploadFolderId(null);
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
              <button
                onClick={() => setShowNewFolder(true)}
                className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* All files */}
              <SidebarMenuItem>
                <div className="flex items-center gap-1 group/folder">
                  <button
                    onClick={() => toggleFolderExpand('all-files')}
                    className="p-1 hover:bg-sidebar-accent rounded flex-shrink-0"
                  >
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${
                        expandedFolders.has('all-files') ? '' : '-rotate-90'
                      }`} 
                    />
                  </button>
                  <SidebarMenuButton
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 text-muted-foreground"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {!collapsed && (
                      <div className="flex items-center flex-1">
                        <span>All Files</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                  {!collapsed && (
                    <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 relative w-20">
                      <button
                        onClick={() => handleFolderAddFiles(null)}
                        className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-accent-foreground opacity-0 group-hover/folder:opacity-100 transition-opacity absolute right-0"
                        aria-label="Add files to All Files"
                        title="Add files to All Files"
                      >
                        <FilePlus className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-max opacity-100 group-hover/folder:opacity-0 transition-opacity ml-auto">
                        {files.length}
                      </span>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              {/* Files in All Files */}
              {expandedFolders.has('all-files') && !collapsed && (
                <SidebarMenu className="pl-6 border-l border-sidebar-border ml-3">
                  {files.filter(f => !f.folderId).map((file) => (
                    <SidebarMenuItem key={file.id}>
                      <SidebarMenuButton
                        onClick={() => router.push(`/read/${file.id}`)}
                        className="text-muted-foreground hover:text-foreground text-sm"
                      >
                        <File className="w-4 h-4" />
                        <span className="truncate text-xs">{file.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}

              {folders.map(folder => {
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
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? '' : '-rotate-90'
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
                          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0 relative w-20">
                            <button
                              onClick={() => handleFolderAddFiles(folder.id)}
                              className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-accent-foreground opacity-0 group-hover/folder:opacity-100 transition-opacity absolute right-6"
                              aria-label={`Add files to folder ${folder.name}`}
                              title={`Add files to folder ${folder.name}`}
                            >
                              <FilePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFolder(folder.id)}
                              className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/folder:opacity-100 transition-opacity absolute right-0"
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
                            <SidebarMenuButton
                              onClick={() => router.push(`/read/${file.id}`)}
                              className="text-muted-foreground hover:text-foreground text-sm"
                            >
                              <File className="w-4 h-4" />
                              <span className="truncate text-xs">{file.name}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cloud Storage */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5" />
            {!collapsed && <span>Cloud Storage</span>}
            {cloudLoading && !collapsed && <Loader2 className="w-3 h-3 animate-spin ml-auto text-muted-foreground" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cloudDirs.map(dir => {
                const isExpanded = expandedCloudDirs.has(dir.name);
                return (
                  <div key={dir.name}>
                    <SidebarMenuItem>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const next = new Set(expandedCloudDirs);
                            if (isExpanded) { next.delete(dir.name); } else { next.add(dir.name); }
                            setExpandedCloudDirs(next);
                          }}
                          className="p-1 hover:bg-sidebar-accent rounded flex-shrink-0"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        <SidebarMenuButton className="flex-1 text-muted-foreground">
                          <FolderOpen className="w-4 h-4" />
                          {!collapsed && <span className="truncate">{dir.name}</span>}
                          {!collapsed && (
                            <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                              {dir.files.length}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </div>
                    </SidebarMenuItem>

                    {isExpanded && !collapsed && (
                      <SidebarMenu className="pl-6 border-l border-sidebar-border ml-3">
                        {dir.files.map(file => (
                          <SidebarMenuItem key={file.id}>
                            <SidebarMenuButton
                              onClick={() => openCloudFile(file.id)}
                              className="text-muted-foreground hover:text-foreground text-sm"
                            >
                              <File className="w-4 h-4" />
                              <span className="truncate text-xs">{file.name}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </div>
                );
              })}
              {!cloudLoading && cloudDirs.length === 0 && !collapsed && (
                <p className="text-[11px] text-muted-foreground px-3 py-2">No cloud files yet</p>
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