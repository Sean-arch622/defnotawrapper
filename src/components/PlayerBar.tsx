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
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-[72px] left-0 right-0 z-50 px-3"
      >
        <div className="rounded-2xl border border-border/20 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/30 overflow-hidden">
          <div className="px-3 py-2.5">
            {/* Track info + time */}
            <div className="flex items-center gap-3 mb-2">
              <motion.img
                key={currentTrack.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{currentTrack.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            {/* Seekable slider */}
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={([v]) => seekTo(v)}
              className="w-full h-3 mb-2"
            />

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleShuffle}>
                <Shuffle className={`h-3.5 w-3.5 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={previous}>
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              <motion.div whileTap={{ scale: 0.92 }}>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </Button>
              </motion.div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next}>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cycleRepeat}>
                  <RepeatIcon className={`h-3.5 w-3.5 ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onQueueOpen}>
                  <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
