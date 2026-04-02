import React, { createContext, useContext, useState, useCallback } from 'react';
import { Track, Playlist, storage } from '@/lib/storage';

interface PlaylistContextType {
  playlists: Playlist[];
  likedSongs: Track[];
  createPlaylist: (name: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  exportPlaylists: () => string;
  importPlaylists: (json: string) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>(storage.getPlaylists());
  const [likedSongs, setLikedSongs] = useState<Track[]>(storage.getLikedSongs());

  const persist = (p: Playlist[]) => { setPlaylists(p); storage.setPlaylists(p); };
  const persistLiked = (t: Track[]) => { setLikedSongs(t); storage.setLikedSongs(t); };

  const createPlaylist = useCallback((name: string) => {
    const p: Playlist = { id: crypto.randomUUID(), name, tracks: [], createdAt: Date.now() };
    persist([...playlists, p]);
  }, [playlists]);

  const renamePlaylist = useCallback((id: string, name: string) => {
    persist(playlists.map(p => p.id === id ? { ...p, name } : p));
  }, [playlists]);

  const deletePlaylist = useCallback((id: string) => {
    persist(playlists.filter(p => p.id !== id));
  }, [playlists]);

  const addToPlaylist = useCallback((playlistId: string, track: Track) => {
    persist(playlists.map(p => {
      if (p.id !== playlistId) return p;
      if (p.tracks.some(t => t.id === track.id)) return p;
      return { ...p, tracks: [...p.tracks, track] };
    }));
  }, [playlists]);

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    persist(playlists.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
    }));
  }, [playlists]);

  const toggleLike = useCallback((track: Track) => {
    const exists = likedSongs.some(t => t.id === track.id);
    persistLiked(exists ? likedSongs.filter(t => t.id !== track.id) : [track, ...likedSongs]);
  }, [likedSongs]);

  const isLiked = useCallback((trackId: string) => likedSongs.some(t => t.id === trackId), [likedSongs]);

  const exportPlaylists = () => JSON.stringify({ playlists, likedSongs }, null, 2);
  const importPlaylists = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.playlists) persist(data.playlists);
      if (data.likedSongs) persistLiked(data.likedSongs);
    } catch { /* ignore */ }
  };

  return (
    <PlaylistContext.Provider value={{
      playlists, likedSongs, createPlaylist, renamePlaylist, deletePlaylist,
      addToPlaylist, removeFromPlaylist, toggleLike, isLiked,
      exportPlaylists, importPlaylists,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider');
  return ctx;
}
