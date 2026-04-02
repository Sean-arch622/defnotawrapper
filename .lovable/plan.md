
# YouTube Music Wrapper App

## Architecture
- **Pages**: Home, Search, Library, Settings, Playlist Detail
- **Persistent UI**: Left sidebar navigation + bottom player bar (always visible)
- **State**: React context for player state, playlists, and theme
- **Storage**: localStorage for playlists, liked songs, history, theme, API key, and search cache

## Core Features

### 1. YouTube Integration
- Settings page with API key input field (stored in localStorage)
- YouTube Data API v3 for search (songs, artists, albums)
- YouTube IFrame Player API for audio playback (hidden 0x0 player)
- Aggressive caching of search results in localStorage to conserve API quota (~100 searches/day limit)

### 2. Player Bar (fixed bottom)
- Left: thumbnail, title, artist
- Center: prev, rewind 10s, play/pause, forward 10s, next + seekable progress bar with timestamps
- Right: volume slider + mute toggle, shuffle, repeat (off → all → one), queue drawer button
- Glassmorphism/frosted blur effect on the bar
- Framer Motion micro-animations on controls

### 3. Best-Effort Ad Handling
- Monitor IFrame `onStateChange` events for unexpected state changes
- Auto-mute during detected ad states, auto-skip when possible
- Toast notification ("Ad Skipped") when triggered
- Restore volume after ad completes

### 4. Queue System
- Side drawer showing current queue
- Drag-to-reorder tracks
- Play from any position in queue

### 5. Playlists & Library
- Create, rename, delete playlists (localStorage)
- "Add to Playlist" option on every track
- Default "Liked Songs" playlist with heart icon toggle on all tracks
- Playlist detail view — play from any track
- All playlists listed in left sidebar

### 6. Home Page / Discovery
- Search bar at top
- Trending/popular sections (pre-built YouTube queries like "official audio 2024")
- Genre buttons (Pop, Hip-Hop, Lo-fi, Rock, Electronic, etc.) that trigger search
- "Recently Played" section from localStorage history

### 7. Light & Dark Theme
- Toggle in top-right corner (sun/moon icon)
- Dark: deep grey backgrounds (#0f0f0f, #1a1a1a), white text, electric blue accent
- Light: white/soft grey (#f5f5f5, #ffffff), dark text, same accent
- Persisted in localStorage, defaults to system preference

### 8. Settings Page
- API key input
- Theme toggle
- Clear history button
- Export/import playlists as JSON

## Design
- Clean, minimal Spotify/Apple Music-inspired UI
- Inter font, rounded cards, frosted glass player bar
- Framer Motion for hover/click animations and page transitions
- Left sidebar navigation, scrollable main content area
- No YouTube branding visible anywhere
