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

// --- Spotify API helpers ---

async function getSpotifyToken(): Promise<string> {
  const clientId = storage.getSpotifyClientId();
  const clientSecret = storage.getSpotifyClientSecret();
  if (!clientId || !clientSecret) throw new Error('missing_spotify_keys');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Spotify auth failed — check your Client ID and Secret');
  const data = await res.json();
  return data.access_token;
}

interface SpotifyTrackInfo { name: string; artist: string }

async function fetchSpotifyPlaylist(
  playlistId: string,
  token: string,
): Promise<{ name: string; tracks: SpotifyTrackInfo[] }> {
  // Get playlist name
  const metaRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Failed to fetch playlist — is it public?');
  const meta = await metaRes.json();

  // Paginate tracks
  const tracks: SpotifyTrackInfo[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(name,artists(name))),next&limit=100`;

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) break;
    const data = await res.json();
    for (const item of data.items || []) {
      const t = item.track;
      if (t?.name) {
        tracks.push({ name: t.name, artist: t.artists?.[0]?.name || '' });
      }
    }
    url = data.next || null;
  }

  return { name: meta.name || 'Imported Playlist', tracks };
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function LibraryPage() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist } = usePlaylist();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState('');
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

    const playlistId = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) {
      toast.error('Please enter a valid Spotify playlist link');
      return;
    }
    if (!storage.getApiKey()) {
      toast.error('Add a YouTube API key in Settings first');
      return;
    }

    setImportLoading(true);
    setImportProgress('Authenticating with Spotify...');

    try {
      let token: string;
      try {
        token = await getSpotifyToken();
      } catch (e: any) {
        if (e.message === 'missing_spotify_keys') {
          toast.error('Add your Spotify Client ID & Secret in Settings first');
          setImportLoading(false);
          setImportProgress('');
          return;
        }
        throw e;
      }

      setImportProgress('Fetching playlist tracks...');
      const { name: playlistName, tracks: spotifyTracks } = await fetchSpotifyPlaylist(playlistId, token);

      if (spotifyTracks.length === 0) {
        toast.info(`"${playlistName}" has no tracks`);
        setImportLoading(false);
        setImportProgress('');
        return;
      }

      // Create playlist
      createPlaylist(playlistName);
      await delay(200);

      let matched = 0;
      let skipped = 0;
      const total = spotifyTracks.length;

      for (let i = 0; i < total; i++) {
        const { name, artist } = spotifyTracks[i];
        setImportProgress(`Matching ${i + 1} of ${total} tracks...`);

        try {
          const results = await searchYouTube(`${name} ${artist}`, false);
          if (results.length > 0) {
            const currentPlaylists = storage.getPlaylists();
            const target = currentPlaylists.find(p => p.name === playlistName);
            if (target && !target.tracks.some(t => t.id === results[0].id)) {
              target.tracks.push(results[0]);
              storage.setPlaylists(currentPlaylists);
              matched++;
            }
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }

        // Rate limit: 300ms between YouTube searches
        if (i < total - 1) await delay(300);
      }

      toast.success(`Imported ${matched} of ${total} tracks from "${playlistName}"${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
      window.location.reload();
    } catch (e: any) {
      toast.error('Import failed: ' + (e.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
      setImportProgress('');
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
