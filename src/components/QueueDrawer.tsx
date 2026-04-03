import { usePlayer } from '@/contexts/PlayerContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface QueueDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function QueueDrawer({ open, onClose }: QueueDrawerProps) {
  const { queue, currentTrack, playFromQueue, removeFromQueue } = usePlayer();

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] p-0 border-border/30">
        <SheetHeader className="p-4 border-b border-border/30">
          <SheetTitle className="text-base">Queue</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>
          ) : (
            queue.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <motion.div
                  key={`${track.id}-${i}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isActive ? 'bg-primary/10' : 'active:bg-accent'
                  }`}
                  onClick={() => playFromQueue(i)}
                >
                  <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? 'text-primary font-medium' : 'text-foreground'}`}>{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {isActive && <Play className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={e => { e.stopPropagation(); removeFromQueue(i); }}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </motion.div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
