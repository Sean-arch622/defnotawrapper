import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlayerBar } from '@/components/PlayerBar';
import { QueueDrawer } from '@/components/QueueDrawer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useState } from 'react';
import { Home, Search, Library, Heart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/library', icon: Library, label: 'Library' },
  { path: '/liked', icon: Heart, label: 'Liked' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  const [queueOpen, setQueueOpen] = useState(false);
  const { currentTrack } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();

  const bottomPadding = currentTrack ? 'pb-36' : 'pb-20';

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <main className={`flex-1 overflow-y-auto ${bottomPadding}`}>
        <Outlet />
      </main>

      <PlayerBar onQueueOpen={() => setQueueOpen(true)} />

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-effect border-t border-border/30 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path || 
              (tab.path === '/library' && location.pathname.startsWith('/playlist'));
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary glow-dot"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <tab.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  );
}
