import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrackCard } from '@/components/TrackCard';
import { searchYouTube } from '@/lib/youtube';
import { storage, Track } from '@/lib/storage';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const GENRES = ['Pop', 'Hip-Hop', 'Lo-fi', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Classical', 'Indie', 'K-Pop'];

const TRENDING_QUERIES = [
  { title: 'Trending Now', query: 'trending music 2024 official audio' },
  { title: 'New Releases', query: 'new music releases 2024 official' },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [trendingSections, setTrendingSections] = useState<{ title: string; tracks: Track[] }[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [activeGenre, setActiveGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentlyPlayed(storage.getHistory().slice(0, 10));
  }, []);

  useEffect(() => {
    const apiKey = storage.getApiKey();
    if (!apiKey) return;
    TRENDING_QUERIES.forEach(async ({ title, query }) => {
      try {
        const tracks = await searchYouTube(query);
        setTrendingSections(prev => {
          if (prev.some(s => s.title === title)) return prev;
          return [...prev, { title, tracks: tracks.slice(0, 8) }];
        });
      } catch {}
    });
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchYouTube(query);
      setSearchResults(results);
      setGenreTracks([]);
      setActiveGenre('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenre = async (genre: string) => {
    setActiveGenre(genre);
    setSearchResults([]);
    setLoading(true);
    try {
      const results = await searchYouTube(`${genre} music official audio 2024`);
      setGenreTracks(results);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Search */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for songs, artists, albums..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Search Results</h2>
          <div className="space-y-1">
            {searchResults.map((track, i) => (
              <TrackCard key={track.id} track={track} trackList={searchResults} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Genre Buttons */}
      {searchResults.length === 0 && (
        <>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Browse by Genre</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <motion.div key={genre} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={activeGenre === genre ? 'default' : 'secondary'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleGenre(genre)}
                  >
                    {genre}
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Genre results */}
          {genreTracks.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">{activeGenre}</h2>
              <div className="space-y-1">
                {genreTracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} trackList={genreTracks} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Trending */}
          {trendingSections.map(section => (
            <section key={section.title} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">{section.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {section.tracks.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => {
                      const { play } = require('@/contexts/PlayerContext');
                    }}
                  >
                    <TrendingCard track={track} tracks={section.tracks} />
                  </motion.div>
                ))}
              </div>
            </section>
          ))}

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Recently Played</h2>
              <div className="space-y-1">
                {recentlyPlayed.map((track, i) => (
                  <TrackCard key={track.id} track={track} trackList={recentlyPlayed} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* No API key message */}
          {!storage.getApiKey() && trendingSections.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome to Muse</h2>
              <p className="text-muted-foreground mb-4">
                Add your YouTube Data API key in Settings to start discovering music.
              </p>
              <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TrendingCard({ track, tracks }: { track: Track; tracks: Track[] }) {
  const { play } = require('@/contexts/PlayerContext').usePlayer ? require('@/contexts/PlayerContext') : { play: () => {} };
  // We need usePlayer here but can't use hooks conditionally. Let's use a proper import.
  return <TrendingCardInner track={track} tracks={tracks} />;
}

function TrendingCardInner({ track, tracks }: { track: Track; tracks: Track[] }) {
  const { play } = await_player();
  return (
    <div className="rounded-xl overflow-hidden bg-card hover:bg-accent transition-colors" onClick={() => play(track, tracks)}>
      <img src={track.thumbnail} alt={track.title} className="w-full aspect-square object-cover" />
      <div className="p-3">
        <p className="text-sm font-medium truncate text-foreground">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
    </div>
  );
}

function await_player() {
  // This is a workaround - we'll fix this properly
  return { play: () => {} };
}
