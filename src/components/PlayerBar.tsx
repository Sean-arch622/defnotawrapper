import { usePlayer } from '@/contexts/PlayerContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  ListMusic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface PlayerBarProps {
  onQueueOpen: () => void;
}

export function PlayerBar({ onQueueOpen }: PlayerBarProps) {
  const {
    currentTrack, isPlaying, progress, duration,
    shuffle, repeat, togglePlay, seekTo,
    toggleShuffle, cycleRepeat, next, previous,
  } = usePlayer();

  if (!currentTrack) return null;

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-16 left-0 right-0 z-50 safe-bottom"
      >
        {/* Progress bar at very top */}
        <div className="px-4">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={1}
            onValueChange={([v]) => seekTo(v)}
            className="w-full"
          />
        </div>

        <div className="glass-effect border-t border-border/20 px-4 pt-2 pb-2">
          {/* Track info row */}
          <div className="flex items-center gap-3 mb-2">
            <motion.img
              key={currentTrack.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-11 h-11 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <span>{formatTime(progress)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleShuffle}>
              <Shuffle className={`h-4 w-4 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={previous}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground glow-primary"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
            </motion.div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={next}>
              <SkipForward className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={cycleRepeat}>
                <RepeatIcon className={`h-4 w-4 ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onQueueOpen}>
                <ListMusic className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
