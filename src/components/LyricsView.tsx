import { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface LyricsViewProps {
  open: boolean;
  onClose: () => void;
}

export function LyricsView({ open, onClose }: LyricsViewProps) {
  const { currentTrack } = usePlayer();
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentTrack) return;
    setLoading(true);
    setLyrics(null);

    const artist = encodeURIComponent(currentTrack.artist);
    const title = encodeURIComponent(currentTrack.title);

    fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setLyrics(data.lyrics || 'No lyrics found.'))
      .catch(() => setLyrics('Lyrics not available for this track.'))
      .finally(() => setLoading(false));
  }, [open, currentTrack?.id]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          <div className="flex items-center justify-between px-4 pt-12 pb-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div className="text-center flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Lyrics</p>
              <p className="text-sm font-semibold truncate text-foreground">
                {currentTrack?.title}
              </p>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <p className="text-base leading-8 text-foreground/80 whitespace-pre-line">
                {lyrics}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
