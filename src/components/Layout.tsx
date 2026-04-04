import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlayerBar } from '@/components/PlayerBar';
import { QueueDrawer } from '@/components/QueueDrawer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useState } from 'react';
import { Home, Search, Library, Heart, Settings } from 'lucide-react';
import { Dock } from '@/components/ui/dock-two';

const tabPaths = ['/', '/search', '/library', '/liked', '/settings'];
const tabIcons = [Home, Search, Library, Heart, Settings] as const;
const tabLabels = ['Home', 'Search', 'Library', 'Liked', 'Settings'];

export function Layout() {
  const [queueOpen, setQueueOpen] = useState(false);
  const { currentTrack } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();

  const bottomPadding = currentTrack ? 'pb-40' : 'pb-24';

  const dockItems = tabPaths.map((path, i) => ({
    icon: tabIcons[i],
    label: tabLabels[i],
    isActive: location.pathname === path || (path === '/library' && location.pathname.startsWith('/playlist')),
    onClick: () => navigate(path),
  }));

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <main className={`flex-1 overflow-y-auto ${bottomPadding}`}>
        <Outlet />
      </main>

      <PlayerBar onQueueOpen={() => setQueueOpen(true)} />
      <Dock items={dockItems} />
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  );
}
