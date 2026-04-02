import { usePlayer } from '@/contexts/PlayerContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ListMusic, Rewind, FastForward,
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
    currentTrack, isPlaying, progress, duration, volume, isMuted,
    shuffle, repeat, togglePlay, seekTo, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, next, previous, skipForward, skipBackward,
  } = usePlayer();

  if (!currentTrack) return null;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50"
      >
        <div className="flex items-center h-20 px-4 max-w-full">
          {/* Track info */}
          <div className="flex items-center gap-3 w-[280px] min-w-0">
            <motion.img
              key={currentTrack.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-14 h-14 rounded-lg object-cover shadow-md"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleShuffle}>
                <Shuffle className={`h-4 w-4 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={previous}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={skipBackward}>
                <Rewind className="h-3.5 w-3.5" />
              </Button>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
              </motion.div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={skipForward}>
                <FastForward className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cycleRepeat}>
                <RepeatIcon className={`h-4 w-4 ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full">
              <span className="text-[10px] text-muted-foreground w-10 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={([v]) => seekTo(v)}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Queue */}
          <div className="flex items-center gap-2 w-[200px] justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onQueueOpen}>
              <ListMusic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              <VolumeIcon className="h-4 w-4" />
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={([v]) => setVolume(v)}
              className="w-24"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
