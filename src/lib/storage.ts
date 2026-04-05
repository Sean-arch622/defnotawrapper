export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  videoId: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export interface SearchCache {
  query: string;
  results: Track[];
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const storage = {
  getApiKey: (): string => localStorage.getItem('yt-api-key') || '',
  setApiKey: (key: string) => localStorage.setItem('yt-api-key', key),

  getSpotifyClientId: (): string => localStorage.getItem('spotify-client-id') || '',
  setSpotifyClientId: (id: string) => localStorage.setItem('spotify-client-id', id),
  getSpotifyClientSecret: (): string => localStorage.getItem('spotify-client-secret') || '',
  setSpotifyClientSecret: (secret: string) => localStorage.setItem('spotify-client-secret', secret),

  getTheme: (): 'light' | 'dark' | 'system' => 'dark',
  setTheme: () => {},

  getPlaylists: (): Playlist[] => {
    try { return JSON.parse(localStorage.getItem('yt-playlists') || '[]'); } catch { return []; }
  },
  setPlaylists: (playlists: Playlist[]) => localStorage.setItem('yt-playlists', JSON.stringify(playlists)),

  getLikedSongs: (): Track[] => {
    try { return JSON.parse(localStorage.getItem('yt-liked') || '[]'); } catch { return []; }
  },
  setLikedSongs: (tracks: Track[]) => localStorage.setItem('yt-liked', JSON.stringify(tracks)),

  getHistory: (): Track[] => {
    try { return JSON.parse(localStorage.getItem('yt-history') || '[]'); } catch { return []; }
  },
  addToHistory: (track: Track) => {
    const history = storage.getHistory().filter(t => t.id !== track.id);
    history.unshift(track);
    localStorage.setItem('yt-history', JSON.stringify(history.slice(0, 50)));
  },
  clearHistory: () => localStorage.removeItem('yt-history'),

  // Search history for personalization
  getSearchHistory: (): string[] => {
    try { return JSON.parse(localStorage.getItem('yt-search-history') || '[]'); } catch { return []; }
  },
  addSearchQuery: (query: string) => {
    const hist = storage.getSearchHistory().filter(q => q !== query.toLowerCase());
    hist.unshift(query.toLowerCase());
    localStorage.setItem('yt-search-history', JSON.stringify(hist.slice(0, 30)));
  },

  getCachedSearch: (query: string): Track[] | null => {
    try {
      const cache: SearchCache[] = JSON.parse(localStorage.getItem('yt-search-cache') || '[]');
      const entry = cache.find(c => c.query === query.toLowerCase());
      if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.results;
      return null;
    } catch { return null; }
  },
  setCachedSearch: (query: string, results: Track[]) => {
    try {
      const cache: SearchCache[] = JSON.parse(localStorage.getItem('yt-search-cache') || '[]');
      const filtered = cache.filter(c => c.query !== query.toLowerCase());
      filtered.unshift({ query: query.toLowerCase(), results, timestamp: Date.now() });
      localStorage.setItem('yt-search-cache', JSON.stringify(filtered.slice(0, 100)));
    } catch {}
  },
};
