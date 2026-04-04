import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface Props {
  children: React.ReactNode;
  showHeader?: boolean;
}

export default function DashboardLayout({ children, showHeader = true }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {showHeader && (
            <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 px-4">
              <SidebarTrigger className="text-muted-foreground" />
            </header>
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
