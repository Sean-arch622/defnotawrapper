import { useState, useRef } from 'react';
import { useTheme, ACCENT_COLORS } from '@/contexts/ThemeContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { storage } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, Trash2, Download, Upload, Palette, Check } from 'lucide-react';
import { toast } from 'sonner';
import { BlurFade } from '@/components/ui/blur-fade';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const [spotifyId, setSpotifyId] = useState(storage.getSpotifyClientId());
  const [spotifySecret, setSpotifySecret] = useState(storage.getSpotifyClientSecret());
  const { accentColor, setAccentColor } = useTheme();
  const { exportPlaylists, importPlaylists } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = () => {
    storage.setApiKey(apiKey);
    toast.success('API key saved');
  };

  const saveSpotifyKeys = () => {
    storage.setSpotifyClientId(spotifyId);
    storage.setSpotifyClientSecret(spotifySecret);
    toast.success('Spotify credentials saved');
  };

  const handleExport = () => {
    const data = exportPlaylists();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muse-playlists.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Playlists exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importPlaylists(reader.result as string);
      toast.success('Playlists imported');
    };
    reader.readAsText(file);
  };

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <BlurFade delay={0}>
        <h1 className="text-2xl font-bold mb-6 text-foreground">Settings</h1>
      </BlurFade>

      <div className="space-y-5">
        <BlurFade delay={0.05}>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">YouTube API Key</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Required for search and playback</p>
            <div className="flex gap-2">
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." className="h-10 rounded-xl bg-background border-border/50 text-sm" />
              <Button onClick={saveApiKey} className="rounded-xl h-10 px-5">Save</Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Get a free key from the{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-primary underline">
                Google Cloud Console
              </a>
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Accent Color</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map(color => {
                const isSelected = accentColor.name === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setAccentColor(color)}
                    className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{
                        backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)`,
                        boxShadow: isSelected ? `0 0 12px hsl(${color.h}, ${color.s}%, ${color.l}% / 0.5)` : undefined,
                      }}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.15}>
          <div className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Data</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl flex-1 h-10 border-border/50">
                  <Download className="h-4 w-4 mr-1.5" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl flex-1 h-10 border-border/50">
                  <Upload className="h-4 w-4 mr-1.5" /> Import
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl w-full h-10 text-destructive hover:text-destructive"
                onClick={() => { storage.clearHistory(); toast.success('History cleared'); }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Clear Play History
              </Button>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
