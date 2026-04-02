import { Track, storage } from './storage';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractArtist(title: string, channelTitle: string): { songTitle: string; artist: string } {
  // Try "Artist - Song Title" pattern
  const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)/);
  if (dashMatch) {
    let artist = dashMatch[1].trim();
    let songTitle = dashMatch[2].trim();
    // Remove common suffixes
    songTitle = songTitle.replace(/\s*\(?(official\s*(music\s*)?video|official\s*audio|lyric\s*video|lyrics?|audio|mv|hd|hq|4k)\)?/gi, '').trim();
    return { songTitle: songTitle || title, artist };
  }
  // Fallback: use channel name minus " - Topic" or "VEVO"
  const artist = channelTitle.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  const songTitle = title.replace(/\s*\(?(official\s*(music\s*)?video|official\s*audio|lyric\s*video|lyrics?|audio|mv|hd|hq|4k)\)?/gi, '').trim();
  return { songTitle: songTitle || title, artist };
}

export async function searchYouTube(query: string): Promise<Track[]> {
  // Check cache first
  const cached = storage.getCachedSearch(query);
  if (cached) return cached;

  const apiKey = storage.getApiKey();
  if (!apiKey) throw new Error('No API key set. Go to Settings to add your YouTube API key.');

  // Search for videos
  const searchUrl = `${API_BASE}/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'YouTube API error');
  }
  const searchData = await searchRes.json();

  const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean).join(',');
  if (!videoIds) return [];

  // Get video details for duration
  const detailsUrl = `${API_BASE}/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  const tracks: Track[] = (detailsData.items || []).map((item: any) => {
    const { songTitle, artist } = extractArtist(item.snippet.title, item.snippet.channelTitle);
    return {
      id: item.id,
      title: songTitle,
      artist,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: parseDuration(item.contentDetails.duration),
      videoId: item.id,
    };
  });

  // Cache results
  storage.setCachedSearch(query, tracks);
  return tracks;
}

// Load YouTube IFrame API
let playerApiLoaded = false;
let playerApiPromise: Promise<void> | null = null;

export function loadYouTubeIFrameAPI(): Promise<void> {
  if (playerApiLoaded) return Promise.resolve();
  if (playerApiPromise) return playerApiPromise;

  playerApiPromise = new Promise<void>((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      playerApiLoaded = true;
      resolve();
      return;
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      playerApiLoaded = true;
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });

  return playerApiPromise;
}
