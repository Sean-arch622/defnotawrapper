import { usePlayer } from '@/contexts/PlayerContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface QueueDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function QueueDrawer({ open, onClose }: QueueDrawerProps) {
  const { queue, currentTrack, playFromQueue, removeFromQueue } = usePlayer();

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[380px] sm:max-w-[380px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg">Play Queue</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto scrollbar-thin p-2" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>
          ) : (
            queue.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <motion.div
                  key={`${track.id}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-2 p-2 rounded-lg group cursor-pointer ${
                    isActive ? 'bg-primary/10' : 'hover:bg-accent'
                  }`}
                  onClick={() => playFromQueue(i)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  <img src={track.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? 'text-primary font-medium' : ''}`}>{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {isActive && <Play className="h-3 w-3 text-primary" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); removeFromQueue(i); }}
                  >
                    <X className="h-3 w-3" />
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
