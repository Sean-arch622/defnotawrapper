import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { playlists, removeFromPlaylist } = usePlaylist();
  const { play } = usePlayer();
  const navigate = useNavigate();

  const playlist = playlists.find(p => p.id === id);
  if (!playlist) return (
    <div className="px-4 pt-12 text-center">
      <p className="text-muted-foreground text-sm">Playlist not found</p>
      <Button variant="ghost" onClick={() => navigate('/library')} className="mt-2 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
    </div>
  );

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate('/library')} className="mb-4 -ml-2 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-1" /> Library
      </Button>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden">
          {playlist.tracks[0] ? (
            <img src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music2 className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{playlist.name}</h1>
          <p className="text-sm text-muted-foreground">{playlist.tracks.length} songs</p>
        </div>
        {playlist.tracks.length > 0 && (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button size="icon" className="h-11 w-11 rounded-full glow-primary" onClick={() => play(playlist.tracks[0], playlist.tracks)}>
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          </motion.div>
        )}
      </motion.div>

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
        <p className="text-center text-muted-foreground py-12 text-sm">No songs yet</p>
      )}
    </div>
  );
}
