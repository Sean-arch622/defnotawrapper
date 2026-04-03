import { usePlaylist } from '@/contexts/PlaylistContext';
import { TrackCard } from '@/components/TrackCard';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LikedSongsPage() {
  const { likedSongs } = usePlaylist();

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Heart className="h-6 w-6 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liked Songs</h1>
          <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
        </div>
      </motion.div>

      {likedSongs.length > 0 ? (
        <div className="space-y-1">
          {likedSongs.map((track, i) => (
            <TrackCard key={track.id} track={track} trackList={likedSongs} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12 text-sm">Songs you like will appear here</p>
      )}
    </div>
  );
}
