'use client';

import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface Props {
  children: React.ReactNode;
  showHeader?: boolean;
  title?: string;
}

export default function DashboardLayout({ children, showHeader = true, title = 'Adaptive dashboard' }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {showHeader && (
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 px-4">
              <div className="h-14 flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{title}</span>
                </div>
              </div>
            </header>
          )}
          <main className="flex-1 relative z-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
