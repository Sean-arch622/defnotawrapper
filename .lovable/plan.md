

# Fix Player Slider, Remove Import/Export, Background Playback

## 1. Fix the progress slider

The current slider uses Radix's `Slider` component with CSS overrides that cause visual glitches — the thumb is a black dot that doesn't align with the track, and the track itself appears disconnected.

**Fix**: Replace the CSS overrides in `index.css` with proper inline styling. Make the thumb a small green (primary-colored) circle, and ensure the track is a continuous bar with the filled portion in primary color and the unfilled portion in a muted grey. Reduce track height to ~3px with an 8px green thumb — no border, no ring.

Changes:
- **`src/index.css`**: Update `.player-slider` styles — set thumb background to `hsl(var(--primary))`, remove border, ensure consistent height
- **`src/components/PlayerBar.tsx`**: Keep the `Slider` but ensure the wrapper class applies correctly

## 2. Remove Import/Export from Settings

Remove the Export and Import buttons (and the hidden file input) from `src/pages/Settings.tsx` in the "Data" section. Keep only the "Clear Play History" button.

## 3. Background playback on Android (sleep mode)

The YouTube IFrame Player API runs inside a web page. When an Android device sleeps, the browser tab gets suspended and the iframe stops. This is a **browser-level limitation** that code alone cannot fully solve.

**What we can do in code:**
- Add a **Web Lock** (`navigator.locks.request`) to signal the browser that work is in progress — this helps prevent tab suspension on some Android browsers
- Add a `visibilitychange` listener that attempts to resume playback when the page becomes visible again (recovery after suspension)
- Ensure the **Media Session API** metadata is always set (already done) — this is the primary mechanism that keeps audio alive on Android Chrome

**What the user needs to do:**
- On Android Chrome, ensure the site is **installed as a PWA** (Add to Home Screen) — PWAs get better background audio treatment
- Disable battery optimization for the browser app in Android Settings

Changes:
- **`src/contexts/PlayerContext.tsx`**: Add Web Lock acquisition when playing, release when paused. Add `visibilitychange` recovery handler.

## Files to modify
1. `src/index.css` — fix `.player-slider` thumb color to green
2. `src/components/PlayerBar.tsx` — minor slider class cleanup
3. `src/pages/Settings.tsx` — remove Export/Import buttons
4. `src/contexts/PlayerContext.tsx` — add Web Lock + visibility recovery for background playback

