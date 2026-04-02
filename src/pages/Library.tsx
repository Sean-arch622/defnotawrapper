import { usePlaylist } from '@/contexts/PlaylistContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Music2, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function LibraryPage() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, likedSongs } = usePlaylist();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setDialogOpen(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Your Library</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Playlist</DialogTitle></DialogHeader>
            <div className="flex gap-2">
              <Input placeholder="Playlist name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liked Songs card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          className="mb-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/liked')}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <Music2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Liked Songs</p>
              <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Playlists */}
      <div className="space-y-2">
        {playlists.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center" onClick={() => navigate(`/playlist/${p.id}`)}>
                  <Music2 className="h-7 w-7 text-muted-foreground" />
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
                    />
                  ) : (
                    <>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.tracks.length} songs</p>
                    </>
                  )}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(p.id); setEditName(p.name); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlaylist(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {playlists.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No playlists yet. Create one to get started!</p>
      )}
    </div>
  );
}
