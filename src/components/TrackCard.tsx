import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { Track } from '@/lib/storage';
import { Heart, Plus, MoreHorizontal, ListPlus } from 'lucide-react';
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03, duration: 0.2 }}
      className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
        isActive ? 'bg-primary/10' : 'hover:bg-accent'
      }`}
      onClick={() => play(track, trackList)}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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

      <span className="text-xs text-muted-foreground mr-1">{track.duration}</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleLike(track)}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-primary text-primary' : ''}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => addToQueue(track)}>
              <ListPlus className="h-4 w-4 mr-2" /> Add to Queue
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
