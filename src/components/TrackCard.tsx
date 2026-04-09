import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { Track } from '@/lib/storage';
import { Heart, Plus, MoreHorizontal, ListPlus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TrackCardProps {
  track: Track;
  trackList?: Track[];
  index?: number;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function TrackCard({ track, trackList, index, showRemove, onRemove }: TrackCardProps) {
  const { play, addToQueue, currentTrack } = usePlayer();
  const { toggleLike, isLiked, playlists, addToPlaylist } = usePlaylist();
  const liked = isLiked(track.id);
  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.02, duration: 0.2 }}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
        isActive ? 'bg-primary/10 border border-primary/20' : 'active:bg-accent'
      }`}
      onClick={() => play(track, trackList)}
    >
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
        {isActive && (
          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-primary-foreground rounded-full"
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      <span className="text-[11px] text-muted-foreground tabular-nums">{track.duration}</span>

      <div className="flex items-center" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleLike(track)}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => addToQueue(track)}>
              <ListPlus className="h-4 w-4 mr-2" /> Add to Queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const url = `https://cobalt-api.kityune.com/api/json`;
              toast.promise(
                fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                  body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${track.videoId}`, isAudioOnly: true }),
                }).then(r => r.json()).then(data => {
                  if (data.url) {
                    const a = document.createElement('a');
                    a.href = data.url;
                    a.download = `${track.title} - ${track.artist}.mp3`;
                    a.click();
                  } else {
                    throw new Error('Download unavailable');
                  }
                }),
                { loading: 'Preparing download...', success: 'Download started!', error: 'Download failed' }
              );
            }}>
              <Download className="h-4 w-4 mr-2" /> Download MP3
            </DropdownMenuItem>
            {playlists.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Plus className="h-4 w-4 mr-2" /> Add to Playlist
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {playlists.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => addToPlaylist(p.id, track)}>
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {showRemove && onRemove && (
              <DropdownMenuItem onClick={onRemove} className="text-destructive">
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
