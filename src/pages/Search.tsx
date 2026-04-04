import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TrackCard } from '@/components/TrackCard';
import { searchYouTube } from '@/lib/youtube';
import { Track } from '@/lib/storage';
import { toast } from 'sonner';
import { BlurFade } from '@/components/ui/blur-fade';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const tracks = await searchYouTube(query);
      setResults(tracks);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <BlurFade delay={0}>
        <h1 className="text-2xl font-bold mb-5 text-foreground">Search</h1>
      </BlurFade>
      <BlurFade delay={0.05}>
        <div className="relative mb-5">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="What do you want to listen to?"
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

      {!loading && results.length > 0 && (
        <BlurFade delay={0.1}>
          <div className="space-y-1">
            {results.map((track, i) => (
              <TrackCard key={track.id} track={track} trackList={results} index={i} />
            ))}
          </div>
        </BlurFade>
      )}

      {!loading && results.length === 0 && query && (
        <p className="text-center text-muted-foreground py-12 text-sm">No results found</p>
      )}

      {!query && (
        <BlurFade delay={0.1}>
          <p className="text-center text-muted-foreground py-16 text-sm">
            Search for your favorite songs, artists, or albums
          </p>
        </BlurFade>
      )}
    </div>
  );
}
