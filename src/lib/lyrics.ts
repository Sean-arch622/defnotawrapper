import { storage } from './storage';

const LRCLIB_BASE = 'https://lrclib.net/api';
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(?(official\s*(music\s*)?video|official\s*audio|lyric\s*video|lyrics?|audio|mv|hd|hq|4k|visualizer|video\s*oficial)\)?/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*\(feat\..*?\)/gi, '')
    .replace(/\s*ft\..*$/gi, '')
    .trim();
}

function cleanArtist(artist: string): string {
  return artist
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s*Official$/i, '')
    .trim();
}

interface LyricsResult {
  lyrics: string;
  source: string;
  synced?: string;
}

// Source 1: LRCLIB search (free, no key, large database)
async function tryLrclib(title: string, artist: string): Promise<LyricsResult | null> {
  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist);

  // Try search endpoint first (more flexible matching)
  const searchUrl = `${LRCLIB_BASE}/search?track_name=${encodeURIComponent(cleanT)}&artist_name=${encodeURIComponent(cleanA)}`;
  const res = await fetch(searchUrl, {
    headers: { 'User-Agent': 'Muse/1.0 (https://defnotawrapper.lovable.app)' },
  });

  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const best = data[0];
      if (best.plainLyrics) {
        return {
          lyrics: best.plainLyrics,
          source: 'LRCLIB',
          synced: best.syncedLyrics || undefined,
        };
      }
    }
  }

  // Try broader search with just the query
  const qUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(`${cleanA} ${cleanT}`)}`;
  const qRes = await fetch(qUrl, {
    headers: { 'User-Agent': 'Muse/1.0 (https://defnotawrapper.lovable.app)' },
  });

  if (qRes.ok) {
    const qData = await qRes.json();
    if (Array.isArray(qData) && qData.length > 0) {
      const best = qData[0];
      if (best.plainLyrics) {
        return {
          lyrics: best.plainLyrics,
          source: 'LRCLIB',
          synced: best.syncedLyrics || undefined,
        };
      }
    }
  }

  return null;
}

// Source 2: lyrics.ovh (free, sometimes works)
async function tryLyricsOvh(title: string, artist: string): Promise<LyricsResult | null> {
  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist);
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanA)}/${encodeURIComponent(cleanT)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.lyrics && data.lyrics.trim().length > 10) {
    return { lyrics: data.lyrics.trim(), source: 'lyrics.ovh' };
  }
  return null;
}

// Source 3: YouTube video description (sometimes contains lyrics)
async function tryYouTubeDescription(videoId: string): Promise<LyricsResult | null> {
  const apiKey = storage.getApiKey();
  if (!apiKey) return null;

  const url = `${YT_API_BASE}/videos?part=snippet&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const description = data.items?.[0]?.snippet?.description || '';

  // Check if description contains lyrics-like content
  const lyricsMarkers = [
    /\[(?:verse|chorus|bridge|intro|outro|hook|pre-chorus)\s*\d*\]/i,
    /\n(?:verse|chorus|bridge|intro|outro)\s*(?:\d+)?:\s*\n/i,
    /lyrics?:/i,
  ];

  const hasLyrics = lyricsMarkers.some(m => m.test(description));
  if (!hasLyrics) {
    // Check if there are enough lines that look like lyrics (short lines, many of them)
    const lines = description.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 80);
    if (lines.length < 8) return null;
  }

  // Try to extract just the lyrics portion
  let lyrics = description;

  // Try to find start of lyrics
  const startMatch = lyrics.match(/(?:lyrics?:?\s*\n|♪\s*\n|\[verse|\[chorus|\[intro)/i);
  if (startMatch?.index !== undefined) {
    lyrics = lyrics.substring(startMatch.index);
  }

  // Remove common non-lyrics sections at the end
  const endPatterns = [
    /\n\s*(?:follow|subscribe|stream|listen|download|available|credits|produced|written|directed|►|🎵|📌|🔔|👉|💿|🎤|instagram|twitter|facebook|tiktok|spotify|apple music|soundcloud)/i,
  ];
  for (const pattern of endPatterns) {
    const match = lyrics.match(pattern);
    if (match?.index !== undefined && match.index > 50) {
      lyrics = lyrics.substring(0, match.index);
    }
  }

  lyrics = lyrics.trim();
  if (lyrics.length < 50) return null;

  return { lyrics, source: 'YouTube' };
}

// Source 4: Search YouTube for "[song] lyrics" video and extract from description
async function tryYouTubeLyricsSearch(title: string, artist: string): Promise<LyricsResult | null> {
  const apiKey = storage.getApiKey();
  if (!apiKey) return null;

  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist);
  const query = `${cleanA} ${cleanT} lyrics`;

  const searchUrl = `${YT_API_BASE}/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();

  const videoIds = searchData.items?.map((i: any) => i.id.videoId).filter(Boolean);
  if (!videoIds?.length) return null;

  // Get full descriptions
  const detailsUrl = `${YT_API_BASE}/videos?part=snippet&id=${videoIds.join(',')}&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) return null;
  const detailsData = await detailsRes.json();

  for (const item of detailsData.items || []) {
    const desc = item.snippet?.description || '';
    const lines = desc.split('\n').filter((l: string) => l.trim().length > 0);

    // Lyrics videos often have the full lyrics in the description
    const lyricsLines = lines.filter((l: string) => l.trim().length < 100 && l.trim().length > 0);
    if (lyricsLines.length >= 8) {
      // Likely contains lyrics
      let lyrics = desc;

      // Remove links and social media
      lyrics = lyrics.replace(/https?:\/\/\S+/g, '').trim();
      const endMatch = lyrics.match(/\n\s*(?:follow|subscribe|stream|listen|credits|produced|►|📌|🔔|👉)/i);
      if (endMatch?.index !== undefined && endMatch.index > 50) {
        lyrics = lyrics.substring(0, endMatch.index);
      }

      lyrics = lyrics.trim();
      if (lyrics.length > 50) {
        return { lyrics, source: 'YouTube Lyrics' };
      }
    }
  }

  return null;
}

// Simple in-memory cache
const lyricsCache = new Map<string, LyricsResult | 'not_found'>();

export async function fetchLyrics(
  title: string,
  artist: string,
  videoId?: string
): Promise<LyricsResult | null> {
  const cacheKey = `${artist}::${title}`;
  const cached = lyricsCache.get(cacheKey);
  if (cached === 'not_found') return null;
  if (cached) return cached;

  // Try sources in order of reliability
  const sources = [
    () => tryLrclib(title, artist),
    () => tryLyricsOvh(title, artist),
    ...(videoId ? [() => tryYouTubeDescription(videoId)] : []),
    () => tryYouTubeLyricsSearch(title, artist),
  ];

  for (const source of sources) {
    try {
      const result = await source();
      if (result) {
        lyricsCache.set(cacheKey, result);
        return result;
      }
    } catch {
      // Continue to next source
    }
  }

  lyricsCache.set(cacheKey, 'not_found');
  return null;
}
