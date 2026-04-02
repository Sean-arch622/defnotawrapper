import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft, Music2 } from 'lucide-react';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { playlists, removeFromPlaylist } = usePlaylist();
  const { play } = usePlayer();
  const navigate = useNavigate();

  const playlist = playlists.find(p => p.id === id);
  if (!playlist) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Playlist not found</p>
      <Button variant="ghost" onClick={() => navigate('/library')} className="mt-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Library
      </Button>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate('/library')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Library
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
          {playlist.tracks[0] ? (
            <img src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Music2 className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{playlist.name}</h1>
          <p className="text-muted-foreground">{playlist.tracks.length} songs</p>
        </div>
        {playlist.tracks.length > 0 && (
          <Button className="ml-auto rounded-full" onClick={() => play(playlist.tracks[0], playlist.tracks)}>
            <Play className="h-4 w-4 mr-1" /> Play
          </Button>
        )}
      </div>

      {playlist.tracks.length > 0 ? (
        <div className="space-y-1">
          {playlist.tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              trackList={playlist.tracks}
              index={i}
              showRemove
              onRemove={() => removeFromPlaylist(playlist.id, track.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No songs in this playlist yet</p>
      )}
    </div>
  );
}
