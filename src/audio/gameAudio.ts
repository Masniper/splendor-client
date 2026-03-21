/**
 * Lightweight procedural SFX via Web Audio API (no asset files).
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
