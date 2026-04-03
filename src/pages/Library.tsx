import { usePlaylist } from '@/contexts/PlaylistContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Music2, Trash2, Pencil, Heart } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
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
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">Library</h1>
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

      {/* Liked Songs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
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
          <div className="w-2 h-2 rounded-full bg-primary glow-dot" />
        </div>
      </motion.div>

      {/* Playlists */}
      <div className="space-y-2">
        {playlists.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
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
          </motion.div>
        ))}
      </div>

      {playlists.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">No playlists yet</p>
      )}
    </div>
  );
}
