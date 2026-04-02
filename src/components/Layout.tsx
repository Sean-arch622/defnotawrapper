import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { PlayerBar } from '@/components/PlayerBar';
import { QueueDrawer } from '@/components/QueueDrawer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useState } from 'react';

export function Layout() {
  const [queueOpen, setQueueOpen] = useState(false);
  const { currentTrack } = usePlayer();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-12 flex items-center border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="ml-2" />
          </header>
          <main className={`flex-1 overflow-y-auto scrollbar-thin ${currentTrack ? 'pb-24' : ''}`}>
            <Outlet />
          </main>
        </div>
      </div>
      <PlayerBar onQueueOpen={() => setQueueOpen(true)} />
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </SidebarProvider>
  );
}
