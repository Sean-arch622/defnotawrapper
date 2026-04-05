import { usePlaylist } from '@/contexts/PlaylistContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Music2, Trash2, Pencil, Heart, Link } from 'lucide-react';
import { useState } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import { searchYouTube } from '@/lib/youtube';
import { storage, Track } from '@/lib/storage';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

async function parseSpotifyPlaylist(url: string): Promise<{ name: string; tracks: string[] } | null> {
  try {
    // Use a CORS proxy or direct fetch to get the Spotify page
    // We'll parse the oEmbed endpoint which doesn't require auth
    const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) return null;

    const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${playlistId}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();

    // Extract playlist name from oembed title
    const name = data.title || 'Imported Playlist';

    // Parse track names from the iframe HTML or description
    // Since oEmbed doesn't give track list, we'll use the page title
    // and search each track on YouTube
    // For now, we get the name and ask user to know it works with limited info
    return { name, tracks: [] };
  } catch {
    return null;
  }
}

export default function LibraryPage() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist } = usePlaylist();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { likedSongs } = usePlaylist();

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setDialogOpen(false);
    }
  };

  const handleSpotifyImport = async () => {
    if (!spotifyUrl.trim()) return;
    if (!spotifyUrl.includes('spotify.com/playlist/')) {
      toast.error('Please enter a valid Spotify playlist link');
      return;
    }
    if (!storage.getApiKey()) {
      toast.error('Add a YouTube API key in Settings first');
      return;
    }

    setImportLoading(true);
    try {
      const playlistSpotifyId = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
      if (!playlistSpotifyId) {
        toast.error('Invalid playlist link');
        setImportLoading(false);
        return;
      }

      // Get playlist name from oEmbed
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${playlistSpotifyId}`);
      const oembedData = await oembedRes.json();
      const playlistName = oembedData.title || 'Imported Playlist';

      // Fetch the embed page via CORS proxy to extract track names
      let trackNames: string[] = [];
      const corsProxies = [
        `https://corsproxy.io/?${encodeURIComponent(`https://open.spotify.com/playlist/${playlistSpotifyId}`)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://open.spotify.com/playlist/${playlistSpotifyId}`)}`,
      ];

      for (const proxyUrl of corsProxies) {
        if (trackNames.length > 0) break;
        try {
          const res = await fetch(proxyUrl);
          if (!res.ok) continue;
          const html = await res.text();

          // Try to extract from meta tags (og:description often has track list)
          const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) 
            || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
          if (descMatch) {
            // Spotify descriptions list tracks like "Song · Artist, Song · Artist, ..."
            const desc = descMatch[1];
            const songs = desc.split(/[,·]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 80);
            // Group pairs: "Song" and "Artist" alternate with · and , separators
            // Actually the format is: "Song · Artist, Song · Artist" 
            // Let's re-parse properly
            const pairs = desc.split(',').map(s => s.trim()).filter(Boolean);
            for (const pair of pairs) {
              // Each pair is "Song · Artist" or just a song name
              const parts = pair.split('·').map(p => p.trim()).filter(Boolean);
              if (parts.length >= 2) {
                // "Song · Artist" - search "Song Artist"
                trackNames.push(`${parts[0]} ${parts[1]}`);
              } else if (parts[0] && parts[0].length > 2) {
                trackNames.push(parts[0]);
              }
            }
          }

          // Also try JSON-LD or inline JSON with track data
          const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
          if (jsonLdMatch && trackNames.length === 0) {
            try {
              const ld = JSON.parse(jsonLdMatch[1]);
              if (ld.track) {
                for (const t of ld.track) {
                  const name = t.name || t.title;
                  const artist = t.byArtist?.name || '';
                  if (name) trackNames.push(artist ? `${name} ${artist}` : name);
                }
              }
            } catch {}
          }

          // Try Spotify's __NEXT_DATA__ or resource JSON
          const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
          if (nextDataMatch && trackNames.length === 0) {
            try {
              const data = JSON.parse(nextDataMatch[1]);
              const items = data?.props?.pageProps?.state?.data?.entity?.trackList || [];
              for (const item of items) {
                const name = item?.track?.name;
                const artist = item?.track?.artists?.[0]?.name;
                if (name) trackNames.push(artist ? `${name} ${artist}` : name);
              }
            } catch {}
          }
        } catch {}
      }

      // Deduplicate and limit
      trackNames = [...new Set(trackNames)].slice(0, 50);

      // Create the playlist
      createPlaylist(playlistName);
      await new Promise(r => setTimeout(r, 200));

      if (trackNames.length === 0) {
        toast.info(`Created "${playlistName}" but couldn't extract tracks. Try adding songs manually.`);
        setSpotifyUrl('');
        setImportDialogOpen(false);
        setImportLoading(false);
        return;
      }

      toast.success(`Importing "${playlistName}" — searching ${trackNames.length} tracks...`);

      let addedCount = 0;
      for (const trackName of trackNames) {
        try {
          const results = await searchYouTube(trackName);
          if (results.length > 0) {
            const currentPlaylists = storage.getPlaylists();
            const targetPlaylist = currentPlaylists.find(p => p.name === playlistName);
            if (targetPlaylist) {
              if (!targetPlaylist.tracks.some(t => t.id === results[0].id)) {
                targetPlaylist.tracks.push(results[0]);
                storage.setPlaylists(currentPlaylists);
                addedCount++;
              }
            }
          }
        } catch {}
      }

      toast.success(`Imported ${addedCount} tracks to "${playlistName}"`);
      window.location.reload();
    } catch (e: any) {
      toast.error('Import failed: ' + (e.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
      setSpotifyUrl('');
      setImportDialogOpen(false);
    }
  };

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <BlurFade delay={0}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Library</h1>
          <div className="flex gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50">
                  <Link className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Import Spotify Playlist</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground mb-3">
                  Paste a Spotify playlist link and we'll search for each track on YouTube to recreate it.
                </p>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="https://open.spotify.com/playlist/..."
                    value={spotifyUrl}
                    onChange={e => setSpotifyUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSpotifyImport()}
                    className="rounded-xl"
                  />
                  <Button onClick={handleSpotifyImport} disabled={importLoading} className="rounded-xl">
                    {importLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </div>
                    ) : 'Import'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="h-9 w-9 rounded-xl">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Playlist</DialogTitle></DialogHeader>
                <div className="flex gap-2">
                  <Input placeholder="Playlist name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} className="rounded-xl" />
                  <Button onClick={handleCreate} className="rounded-xl">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </BlurFade>

      {/* Liked Songs */}
      <BlurFade delay={0.05}>
        <div
          className="glass-card rounded-2xl p-4 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate('/liked')}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Liked Songs</p>
              <p className="text-xs text-muted-foreground">{likedSongs.length} songs</p>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Playlists */}
      <div className="space-y-2">
        {playlists.map((p, i) => (
          <BlurFade key={p.id} delay={0.08 + i * 0.04}>
            <div className="glass-card rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden" onClick={() => navigate(`/playlist/${p.id}`)}>
                  {p.tracks[0] ? (
                    <img src={p.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0" onClick={() => navigate(`/playlist/${p.id}`)}>
                  {editingId === p.id ? (
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => { renamePlaylist(p.id, editName); setEditingId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { renamePlaylist(p.id, editName); setEditingId(null); } }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      className="h-8 rounded-lg text-sm"
                    />
                  ) : (
                    <>
                      <p className="font-semibold text-foreground text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.tracks.length} songs</p>
                    </>
                  )}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(p.id); setEditName(p.name); }}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deletePlaylist(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </BlurFade>
        ))}
      </div>

      {playlists.length === 0 && (
        <BlurFade delay={0.1}>
          <p className="text-center text-muted-foreground py-8 text-sm">No playlists yet</p>
        </BlurFade>
      )}
    </div>
  );
}
