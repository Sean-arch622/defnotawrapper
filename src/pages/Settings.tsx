import { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { storage } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Key, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { exportPlaylists, importPlaylists } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = () => {
    storage.setApiKey(apiKey);
    toast.success('API key saved');
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Settings</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> YouTube API Key</CardTitle>
            <CardDescription>Enter your YouTube Data API v3 key to enable search and playback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." />
              <Button onClick={saveApiKey}>Save</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get a free key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-primary underline">Google Cloud Console</a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dark Mode</Label>
              <Switch checked={resolvedTheme === 'dark'} onCheckedChange={c => setTheme(c ? 'dark' : 'light')} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Use System Theme</Label>
              <Switch checked={theme === 'system'} onCheckedChange={c => setTheme(c ? 'system' : resolvedTheme)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export Playlists
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Import Playlists
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { storage.clearHistory(); toast.success('History cleared'); }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Clear Play History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
