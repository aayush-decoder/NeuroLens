import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FolderOpen, Plus, Home, User, LogOut, Moon, Sun,
  ChevronRight, Trash2, Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
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

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { files, folders, theme, addFolder, removeFolder, setTheme } = useFileStore();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleShowAllFiles = () => {
    router.push('/');
    window.dispatchEvent(new Event('adaptive-reader:show-all-files'));
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

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center flex-shrink-0"
          >
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">AppName</h1>
              <p className="text-[10px] text-muted-foreground">Adaptive Reader</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/')}
                  className={isActive('/') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
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
                <SidebarMenuButton
                  onClick={handleShowAllFiles}
                  className="text-muted-foreground"
                >
                  <FolderOpen className="w-4 h-4" />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span>All Files</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{files.length}</span>
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {folders.map(folder => {
                const count = files.filter(f => f.folderId === folder.id).length;
                return (
                  <SidebarMenuItem key={folder.id}>
                    <SidebarMenuButton className="group/folder text-muted-foreground pr-8">
                      <FolderOpen className="w-4 h-4" style={{ color: folder.color || undefined }} />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{folder.name}</span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                        </div>
                      )}
                    </SidebarMenuButton>
                    {!collapsed && (
                      <SidebarMenuAction
                        onClick={() => removeFolder(folder.id)}
                        showOnHover
                        aria-label={`Delete folder ${folder.name}`}
                        title={`Delete folder ${folder.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </SidebarMenuAction>
                    )}
                  </SidebarMenuItem>
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
                onClick={signOut}
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
