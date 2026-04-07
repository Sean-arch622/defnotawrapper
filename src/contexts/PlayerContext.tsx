import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Track, storage } from '@/lib/storage';
import { loadYouTubeIFrameAPI } from '@/lib/youtube';
import { toast } from 'sonner';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Track[];
  play: (track: Track, trackList?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => void;
  previous: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  playFromQueue: (index: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Media Session helper
function updateMediaSession(track: Track, isPlaying: boolean) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    artwork: [
      { src: track.thumbnail, sizes: '320x180', type: 'image/jpeg' },
    ],
  });
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const wakeLockRef = useRef<AbortController | null>(null);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();
  const previousVolumeRef = useRef(80);
  const adCheckRef = useRef(false);

  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'yt-player-container';
    div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(div);
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player';
    div.appendChild(playerDiv);
    containerRef.current = div;
    return () => { div.remove(); };
  }, []);

  // Setup Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seekTo(details.seekTime);
    });
  });

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
        setProgress(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration());
      }
    }, 500);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
  }, []);

  // Web Lock for background playback
  const acquireWakeLock = useCallback(() => {
    if (wakeLockRef.current) return;
    if ('locks' in navigator) {
      const controller = new AbortController();
      wakeLockRef.current = controller;
      navigator.locks.request('player-wake-lock', { signal: controller.signal }, () =>
        new Promise<void>(() => {}) // hold indefinitely until aborted
      ).catch(() => {});
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.abort();
      wakeLockRef.current = null;
    }
  }, []);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
    }
    if (nextIdx >= queue.length) {
      if (repeat === 'all') nextIdx = 0;
      else { setIsPlaying(false); stopProgressTracking(); return; }
    }
    setQueueIndex(nextIdx);
    loadAndPlay(queue[nextIdx]);
  }, [queue, queueIndex, shuffle, repeat]);

  const loadAndPlay = useCallback(async (track: Track) => {
    await loadYouTubeIFrameAPI();
    const YT = (window as any).YT;

    if (playerRef.current?.destroy) {
      playerRef.current.destroy();
    }

    const container = document.getElementById('yt-player-container');
    if (container) {
      const oldPlayer = document.getElementById('yt-player');
      if (oldPlayer) oldPlayer.remove();
      const newDiv = document.createElement('div');
      newDiv.id = 'yt-player';
      container.appendChild(newDiv);
    }

    playerRef.current = new YT.Player('yt-player', {
      height: '1',
      width: '1',
      videoId: track.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: (e: any) => {
          e.target.setVolume(isMuted ? 0 : volume);
          e.target.playVideo();
          setIsPlaying(true);
          startProgressTracking();
          storage.addToHistory(track);
          updateMediaSession(track, true);
          acquireWakeLock();
        },
        onStateChange: (e: any) => {
          const state = e.data;
          if (state === YT.PlayerState.ENDED) {
            if (repeat === 'one') {
              e.target.seekTo(0);
              e.target.playVideo();
            } else {
              playNext();
            }
          }
          if (state === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startProgressTracking();
            updateMediaSession(track, true);
            const dur = e.target.getDuration();
            if (dur > 0 && dur < 15 && !adCheckRef.current) {
              adCheckRef.current = true;
              e.target.mute();
              toast('Ad Detected — Skipping', { description: 'Muted and fast-forwarding ad' });
              e.target.seekTo(dur - 0.5, true);
              setTimeout(() => {
                if (playerRef.current) {
                  playerRef.current.unMute();
                  playerRef.current.setVolume(volume);
                }
                adCheckRef.current = false;
              }, 1500);
            }
          }
          if (state === YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            updateMediaSession(track, false);
          }
        },
        onError: () => {
          toast.error('Playback error — skipping track');
          playNext();
        },
      },
    });
  }, [volume, isMuted, repeat, startProgressTracking, playNext, acquireWakeLock]);

  const play = useCallback((track: Track, trackList?: Track[]) => {
    setCurrentTrack(track);
    if (trackList && trackList.length > 0) {
      setQueueState(trackList);
      const idx = trackList.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else if (queue.length === 0) {
      setQueueState([track]);
      setQueueIndex(0);
    }
    loadAndPlay(track);
  }, [loadAndPlay, queue]);

  // Visibility recovery - resume playback when app returns to foreground
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && currentTrack && isPlaying) {
        const state = playerRef.current?.getPlayerState?.();
        const YT = (window as any).YT;
        if (YT && state !== undefined && state !== YT.PlayerState.PLAYING) {
          playerRef.current?.playVideo?.();
        }
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [currentTrack, isPlaying]);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo?.();
    setIsPlaying(false);
    stopProgressTracking();
    releaseWakeLock();
  }, [stopProgressTracking, releaseWakeLock]);

  const resume = useCallback(() => {
    playerRef.current?.playVideo?.();
    setIsPlaying(true);
    startProgressTracking();
    acquireWakeLock();
  }, [startProgressTracking, acquireWakeLock]);

  const togglePlay = useCallback(() => {
    isPlaying ? pause() : resume();
  }, [isPlaying, pause, resume]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo?.(seconds, true);
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setIsMuted(false);
    playerRef.current?.unMute?.();
    playerRef.current?.setVolume?.(v);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute?.();
      playerRef.current?.setVolume?.(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
      playerRef.current?.mute?.();
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off');
  }, []);

  const next = useCallback(() => playNext(), [playNext]);
  const previous = useCallback(() => {
    if (progress > 3) { seekTo(0); return; }
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) prevIdx = repeat === 'all' ? queue.length - 1 : 0;
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    loadAndPlay(queue[prevIdx]);
  }, [queue, queueIndex, progress, repeat, seekTo, loadAndPlay]);

  const skipForward = useCallback(() => seekTo(Math.min(progress + 10, duration)), [seekTo, progress, duration]);
  const skipBackward = useCallback(() => seekTo(Math.max(progress - 10, 0)), [seekTo, progress]);

  const setQueue = useCallback((tracks: Track[]) => setQueueState(tracks), []);
  const addToQueue = useCallback((track: Track) => {
    setQueueState(q => [...q, track]);
    toast.success(`Added "${track.title}" to queue`);
  }, []);
  const removeFromQueue = useCallback((index: number) => {
    setQueueState(q => q.filter((_, i) => i !== index));
  }, []);
  const reorderQueue = useCallback((from: number, to: number) => {
    setQueueState(q => {
      const newQ = [...q];
      const [moved] = newQ.splice(from, 1);
      newQ.splice(to, 0, moved);
      return newQ;
    });
  }, []);
  const playFromQueue = useCallback((index: number) => {
    if (queue[index]) {
      setQueueIndex(index);
      setCurrentTrack(queue[index]);
      loadAndPlay(queue[index]);
    }
  }, [queue, loadAndPlay]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume, isMuted,
      shuffle, repeat, queue, play, pause, resume, togglePlay, seekTo,
      setVolume, toggleMute, toggleShuffle, cycleRepeat, next, previous,
      skipForward, skipBackward, setQueue, addToQueue, removeFromQueue,
      reorderQueue, playFromQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
