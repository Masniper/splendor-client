/**
 * Lightweight procedural SFX + background music via Web Audio API (no asset files).
 * Requires a user gesture; GameAudioProvider primes resume on first click/keydown.
 */

export type GameSoundId =
  | "uiTap"
  | "gemPick"
  | "card"
  | "actionSubmit"
  | "purchase"
  | "reserve"
  | "discard"
  | "noble"
  | "yourTurn"
  | "gameStart"
  | "error"
  | "success"
  | "win"
  | "lose"
  | "chatNotify";

let sharedCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!sharedCtx) sharedCtx = new AC();
    return sharedCtx;
  } catch {
    return null;
  }
}

export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume();
}

function tone(
  ctx: AudioContext,
  t0: number,
  freq: number,
  dur: number,
  vol: number,
  type: OscillatorType = "sine",
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const peak = Math.min(0.25, Math.max(0.0001, vol));
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function chordArp(
  ctx: AudioContext,
  t0: number,
  freqs: number[],
  step: number,
  vol: number,
): void {
  freqs.forEach((f, i) => {
    tone(ctx, t0 + i * step, f, step * 1.8, vol * 0.7);
  });
}

/** Play sound (ignores mute — use GameAudioContext.play for respect mute). */
export function playGameSound(id: GameSoundId): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = 0.12;

  switch (id) {
    case "uiTap":
      tone(ctx, now, 1400, 0.04, master * 0.45, "sine");
      break;
    case "gemPick":
      tone(ctx, now, 660, 0.05, master * 0.55, "sine");
      tone(ctx, now + 0.04, 990, 0.06, master * 0.4, "sine");
      break;
    case "card":
      tone(ctx, now, 520, 0.07, master * 0.5, "triangle");
      tone(ctx, now + 0.05, 380, 0.08, master * 0.35, "triangle");
      break;
    case "actionSubmit":
      chordArp(ctx, now, [392, 523, 659], 0.045, master * 0.4);
      break;
    case "purchase":
      chordArp(ctx, now, [523, 659, 784, 1047], 0.05, master * 0.45);
      break;
    case "reserve":
      tone(ctx, now, 330, 0.1, master * 0.5, "sine");
      tone(ctx, now + 0.08, 440, 0.12, master * 0.35, "sine");
      break;
    case "discard":
      tone(ctx, now, 280, 0.09, master * 0.4, "triangle");
      tone(ctx, now + 0.06, 200, 0.11, master * 0.3, "triangle");
      break;
    case "noble":
      chordArp(ctx, now, [784, 988, 1175], 0.06, master * 0.42);
      break;
    case "yourTurn":
      tone(ctx, now, 880, 0.12, master * 0.5, "sine");
      tone(ctx, now + 0.1, 1175, 0.14, master * 0.38, "sine");
      tone(ctx, now + 0.2, 1320, 0.16, master * 0.32, "sine");
      break;
    case "gameStart":
      chordArp(ctx, now, [262, 330, 392, 523, 659], 0.055, master * 0.38);
      break;
    case "error":
      tone(ctx, now, 180, 0.14, master * 0.55, "sawtooth");
      tone(ctx, now + 0.1, 120, 0.16, master * 0.4, "sawtooth");
      break;
    case "success":
      chordArp(ctx, now, [523, 659], 0.07, master * 0.45);
      break;
    case "win":
      chordArp(ctx, now, [523, 659, 784, 1047, 1319], 0.065, master * 0.5);
      tone(ctx, now + 0.45, 1568, 0.25, master * 0.35, "sine");
      break;
    case "lose":
      tone(ctx, now, 220, 0.18, master * 0.45, "triangle");
      tone(ctx, now + 0.15, 175, 0.22, master * 0.38, "triangle");
      tone(ctx, now + 0.32, 147, 0.28, master * 0.32, "triangle");
      break;
    case "chatNotify":
      tone(ctx, now, 880, 0.06, master * 0.35, "sine");
      tone(ctx, now + 0.07, 1175, 0.08, master * 0.28, "sine");
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Procedural background music — multiple tracks
// ---------------------------------------------------------------------------

export type MusicTrackId = 'mystic' | 'royal' | 'dungeon' | 'tavern' | 'none';

export const MUSIC_TRACKS: { id: MusicTrackId; label: string }[] = [
  { id: 'none',    label: 'Off' },
  { id: 'mystic',  label: 'Mystic' },
  { id: 'royal',   label: 'Royal' },
  { id: 'dungeon', label: 'Dungeon' },
  { id: 'tavern',  label: 'Tavern' },
];

const MUSIC_STORAGE_KEY = 'splendor:musicTrack';

export function getSavedMusicTrack(): MusicTrackId {
  try {
    const v = window.localStorage.getItem(MUSIC_STORAGE_KEY) as MusicTrackId | null;
    if (v && MUSIC_TRACKS.some((t) => t.id === v)) return v;
  } catch { /* ignore */ }
  return 'mystic';
}

export function saveMusicTrack(id: MusicTrackId): void {
  try { window.localStorage.setItem(MUSIC_STORAGE_KEY, id); } catch { /* ignore */ }
}

// ---- shared helpers --------------------------------------------------------

function bgTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  t: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'sine',
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  const v = Math.min(0.25, Math.max(0.0001, vol));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.88);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

// ---- track definitions -----------------------------------------------------

/**
 * Mystic: D natural-minor pentatonic, soft arpeggios + pad — calm & atmospheric.
 */
function createMysticTick(ctx: AudioContext, master: GainNode) {
  const NOTES = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25];
  const PAT   = [0, 2, 3, 4, 5, 4, 3, 2, 1, 2, 4, 5, 7, 5, 4, 3];
  const BASS  = [73.42, 110.00, 73.42, 98.00];
  const STEP  = 0.38;
  let idx = 0;
  const tick = () => {
    if (!bgRunning || bgMasterGain !== master) return;
    const c = getAudioContext();
    if (!c) return;
    const now = c.currentTime;
    const pi = idx % PAT.length;
    bgTone(c, master, NOTES[PAT[pi]], now, STEP * 0.75, 0.042);
    if (pi % 4 === 0) bgTone(c, master, BASS[Math.floor(pi / 4) % BASS.length], now, STEP * 3.8, 0.032, 'triangle');
    if (pi % 8 === 0) {
      const r = NOTES[PAT[pi]];
      bgTone(c, master, r * 1.5, now, STEP * 7, 0.016, 'sine');
      bgTone(c, master, r * 1.189, now, STEP * 7, 0.012, 'sine');
    }
    idx++;
    bgScheduleTimer = setTimeout(tick, STEP * 940);
  };
  return tick;
}

/**
 * Royal: C major, bright arpeggios — merchant court vibes.
 */
function createRoyalTick(ctx: AudioContext, master: GainNode) {
  const NOTES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
  const PAT   = [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 7, 9, 7, 5, 4];
  const BASS  = [130.81, 164.81, 130.81, 196.00];
  const STEP  = 0.30;
  let idx = 0;
  const tick = () => {
    if (!bgRunning || bgMasterGain !== master) return;
    const c = getAudioContext();
    if (!c) return;
    const now = c.currentTime;
    const pi = idx % PAT.length;
    bgTone(c, master, NOTES[PAT[pi]], now, STEP * 0.65, 0.038, 'triangle');
    if (pi % 4 === 0) bgTone(c, master, BASS[Math.floor(pi / 4) % BASS.length], now, STEP * 3.5, 0.028, 'triangle');
    if (pi % 8 === 0) {
      const r = NOTES[PAT[pi]];
      bgTone(c, master, r * 1.25, now, STEP * 6, 0.014, 'sine');
      bgTone(c, master, r * 1.5, now, STEP * 6, 0.010, 'sine');
    }
    idx++;
    bgScheduleTimer = setTimeout(tick, STEP * 940);
  };
  return tick;
}

/**
 * Dungeon: C Phrygian, slow and sparse — tense, dark atmosphere.
 */
function createDungeonTick(ctx: AudioContext, master: GainNode) {
  const NOTES = [130.81, 138.59, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63, 277.18, 311.13];
  const PAT   = [0, 0, 2, 0, 4, 2, 0, 6, 4, 2, 0, 2, 4, 0, 6, 4];
  const BASS  = [65.41, 65.41, 87.31, 65.41];
  const STEP  = 0.55;
  let idx = 0;
  const tick = () => {
    if (!bgRunning || bgMasterGain !== master) return;
    const c = getAudioContext();
    if (!c) return;
    const now = c.currentTime;
    const pi = idx % PAT.length;
    bgTone(c, master, NOTES[PAT[pi]], now, STEP * 0.9, 0.035, 'sine');
    if (pi % 4 === 0) bgTone(c, master, BASS[Math.floor(pi / 4) % BASS.length], now, STEP * 4.5, 0.040, 'sine');
    if (pi % 8 === 0) {
      const r = NOTES[PAT[pi]];
      bgTone(c, master, r * 1.333, now, STEP * 9, 0.018, 'sine');
    }
    idx++;
    bgScheduleTimer = setTimeout(tick, STEP * 940);
  };
  return tick;
}

/**
 * Tavern: G Mixolydian, lively jig feel — warm and energetic.
 */
function createTavernTick(ctx: AudioContext, master: GainNode) {
  const NOTES = [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88];
  const PAT   = [0, 2, 4, 5, 4, 2, 0, 2, 4, 7, 5, 4, 5, 7, 9, 7];
  const BASS  = [98.00, 123.47, 98.00, 130.81];
  const STEP  = 0.25;
  let idx = 0;
  const tick = () => {
    if (!bgRunning || bgMasterGain !== master) return;
    const c = getAudioContext();
    if (!c) return;
    const now = c.currentTime;
    const pi = idx % PAT.length;
    bgTone(c, master, NOTES[PAT[pi]], now, STEP * 0.6, 0.044, 'triangle');
    if (pi % 4 === 0) bgTone(c, master, BASS[Math.floor(pi / 4) % BASS.length], now, STEP * 3, 0.034, 'sine');
    if (pi % 8 === 0) {
      const r = NOTES[PAT[pi]];
      bgTone(c, master, r * 1.5, now, STEP * 5, 0.013, 'sine');
    }
    idx++;
    bgScheduleTimer = setTimeout(tick, STEP * 940);
  };
  return tick;
}

// ---- state & public API ----------------------------------------------------

let bgRunning = false;
let bgScheduleTimer: ReturnType<typeof setTimeout> | null = null;
let bgMasterGain: GainNode | null = null;
let bgCurrentTrack: MusicTrackId = 'none';

export function startBackgroundMusic(trackId?: MusicTrackId): void {
  const id = trackId ?? bgCurrentTrack;
  if (id === 'none') { stopBackgroundMusic(); return; }

  // If already playing the same track, do nothing
  if (bgRunning && bgCurrentTrack === id) return;

  stopBackgroundMusic();

  const ctx = getAudioContext();
  if (!ctx) return;

  bgRunning = true;
  bgCurrentTrack = id;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 3.5);
  master.connect(ctx.destination);
  bgMasterGain = master;

  const tickMap: Record<Exclude<MusicTrackId, 'none'>, (c: AudioContext, m: GainNode) => () => void> = {
    mystic:  createMysticTick,
    royal:   createRoyalTick,
    dungeon: createDungeonTick,
    tavern:  createTavernTick,
  };

  const factory = tickMap[id as Exclude<MusicTrackId, 'none'>];
  if (factory) factory(ctx, master)();
}

export function stopBackgroundMusic(): void {
  bgRunning = false;
  if (bgScheduleTimer != null) {
    clearTimeout(bgScheduleTimer);
    bgScheduleTimer = null;
  }
  const ctx = getAudioContext();
  if (bgMasterGain && ctx) {
    const g = bgMasterGain;
    bgMasterGain = null;
    try {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    } catch { /* ignore */ }
    setTimeout(() => { try { g.disconnect(); } catch { /* ignore */ } }, 2200);
  }
}
