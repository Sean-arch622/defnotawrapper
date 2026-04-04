import { usePlaylist } from '@/contexts/PlaylistContext';
import { TrackCard } from '@/components/TrackCard';
import { Heart } from 'lucide-react';
import { BlurFade } from '@/components/ui/blur-fade';

export default function LikedSongsPage() {
  const { likedSongs } = usePlaylist();

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <BlurFade delay={0}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Heart className="h-6 w-6 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Liked Songs</h1>
            <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
          </div>
        </div>
      </BlurFade>

      {likedSongs.length > 0 ? (
        <BlurFade delay={0.08}>
          <div className="space-y-1">
            {likedSongs.map((track, i) => (
              <TrackCard key={track.id} track={track} trackList={likedSongs} index={i} />
            ))}
          </div>
        </BlurFade>
      ) : (
        <BlurFade delay={0.08}>
          <p className="text-center text-muted-foreground py-12 text-sm">Songs you like will appear here</p>
        </BlurFade>
      )}
    </div>
  );
}
