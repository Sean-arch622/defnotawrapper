import { usePlaylist } from '@/contexts/PlaylistContext';
import { TrackCard } from '@/components/TrackCard';
import { Heart } from 'lucide-react';

export default function LikedSongsPage() {
  const { likedSongs } = usePlaylist();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Liked Songs</h1>
          <p className="text-muted-foreground">{likedSongs.length} songs</p>
        </div>
      </div>

      {likedSongs.length > 0 ? (
        <div className="space-y-1">
          {likedSongs.map((track, i) => (
            <TrackCard key={track.id} track={track} trackList={likedSongs} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Songs you like will appear here</p>
      )}
    </div>
  );
}
