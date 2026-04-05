import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TrackCard } from '@/components/TrackCard';
import { searchYouTube } from '@/lib/youtube';
import { storage, Track } from '@/lib/storage';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'sonner';
import { BlurFade } from '@/components/ui/blur-fade';

const GENRES = ['Pop', 'Hip-Hop', 'Lo-fi', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Indie', 'K-Pop'];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [personalizedSections, setPersonalizedSections] = useState<{ title: string; tracks: Track[] }[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [activeGenre, setActiveGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const navigate = useNavigate();
  const { play } = usePlayer();

  useEffect(() => {
    setRecentlyPlayed(storage.getHistory().slice(0, 8));
  }, []);

  useEffect(() => {
    const apiKey = storage.getApiKey();
    if (!apiKey) return;

    const searchHistory = storage.getSearchHistory();
    const history = storage.getHistory();

    const personalQueries: { title: string; query: string }[] = [];

    const artistCounts: Record<string, number> = {};
    history.forEach(t => {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([artist]) => artist);

    topArtists.forEach(artist => {
      personalQueries.push({ title: `More from ${artist}`, query: `${artist} official audio` });
    });

    searchHistory.slice(0, 2).forEach(q => {
      if (!topArtists.some(a => q.toLowerCase().includes(a.toLowerCase()))) {
        // Clean the query - only use the original search term
        const cleanQuery = q.replace(/\s*(similar songs|official audio|songs)\s*/gi, '').trim();
        const displayQuery = cleanQuery || q;
        personalQueries.push({ title: `Because you searched "${displayQuery}"`, query: `${displayQuery} similar songs` });
      }
    });

    if (personalQueries.length === 0) {
      personalQueries.push(
        { title: 'Trending Now', query: 'trending music 2025 official audio' },
        { title: 'New Releases', query: 'new music releases 2025 official' },
      );
    }

    personalQueries.slice(0, 3).forEach(async ({ title, query }) => {
      try {
        const tracks = await searchYouTube(query, false);
        setPersonalizedSections(prev => {
          if (prev.some(s => s.title === title)) return prev;
          return [...prev, { title, tracks: tracks.slice(0, 6) }];
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
      const results = await searchYouTube(`${genre} music official audio 2025`);
      setGenreTracks(results);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <BlurFade delay={0}>
        <h1 className="text-2xl font-bold text-foreground">Discover</h1>
        <p className="text-sm text-muted-foreground mt-0.5 mb-6">Find your next favorite track</p>
      </BlurFade>

      <BlurFade delay={0.05}>
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs, artists..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-11 h-12 rounded-2xl bg-card border-border/50 text-sm"
          />
        </div>
      </BlurFade>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <BlurFade delay={0.1}>
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Results</h2>
            <div className="space-y-1">
              {searchResults.map((track, i) => (
                <TrackCard key={track.id} track={track} trackList={searchResults} index={i} />
              ))}
            </div>
          </section>
        </BlurFade>
      )}

      {!loading && searchResults.length === 0 && (
        <>
          <BlurFade delay={0.1}>
            <section className="mb-6">
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                      activeGenre === genre
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border/50 text-foreground'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </section>
          </BlurFade>

          {genreTracks.length > 0 && (
            <BlurFade delay={0.15}>
              <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-foreground">{activeGenre}</h2>
                <div className="space-y-1">
                  {genreTracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} trackList={genreTracks} index={i} />
                  ))}
                </div>
              </section>
            </BlurFade>
          )}

          {personalizedSections.map((section, sIdx) => (
            <BlurFade key={section.title} delay={0.1 + sIdx * 0.08}>
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                  {section.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="snap-start cursor-pointer flex-shrink-0 w-36 active:scale-95 transition-transform"
                      onClick={() => play(track, section.tracks)}
                    >
                      <div className="w-36 h-36 rounded-2xl overflow-hidden mb-2">
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm font-medium truncate text-foreground">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  ))}
                </div>
              </section>
            </BlurFade>
          ))}

          {recentlyPlayed.length > 0 && (
            <BlurFade delay={0.2}>
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Recently Played</h2>
                </div>
                <div className="space-y-1">
                  {recentlyPlayed.map((track, i) => (
                    <TrackCard key={track.id} track={track} trackList={recentlyPlayed} index={i} />
                  ))}
                </div>
              </section>
            </BlurFade>
          )}

          {!storage.getApiKey() && personalizedSections.length === 0 && (
            <BlurFade delay={0.1}>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">Welcome to Muse</h2>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                  Add your YouTube API key in Settings to start discovering music
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm active:scale-95 transition-transform"
                >
                  Go to Settings
                </button>
              </div>
            </BlurFade>
          )}
        </>
      )}
    </div>
  );
}
