import type { TokenFlightItem } from "../components/TokenFlightOverlay";
import {
  TOKEN_FLIGHT_DURATION_S,
  TOKEN_FLIGHT_STAGGER_S,
} from "../components/TokenFlightOverlay";
import type { GemColor } from "../game/models";

function serializeRect(r: DOMRect): TokenFlightItem["from"] {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** Capture bank → player token slot positions in the current viewport (call before game state applies). */
export function buildTakeTokenFlights(
  tokens: GemColor[],
  targetPlayerId: string,
): TokenFlightItem[] | null {
  const items: TokenFlightItem[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const color = tokens[i];
    const fromEl = document.querySelector(`[data-bank-pile="${color}"]`);
    const toEl = document.querySelector(
      `[data-token-landmark="${targetPlayerId}:${color}"]`,
    );
    if (!fromEl || !toEl) return null;
    items.push({
      id: `tf-${Date.now()}-${i}-${color}`,
      color,
      from: serializeRect(fromEl.getBoundingClientRect()),
      to: serializeRect(toEl.getBoundingClientRect()),
    });
  }
  return items;
}

/** Player → bank (discard / return tokens). */
export function buildDiscardTokenFlights(
  tokens: GemColor[],
  sourcePlayerId: string,
): TokenFlightItem[] | null {
  const items: TokenFlightItem[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const color = tokens[i];
    const fromEl = document.querySelector(
      `[data-token-landmark="${sourcePlayerId}:${color}"]`,
    );
    const toEl = document.querySelector(`[data-bank-pile="${color}"]`);
    if (!fromEl || !toEl) return null;
    items.push({
      id: `df-${Date.now()}-${i}-${color}`,
      color,
      from: serializeRect(fromEl.getBoundingClientRect()),
      to: serializeRect(toEl.getBoundingClientRect()),
    });
  }
  return items;
}

export function tokenFlightTotalMs(len: number) {
  return (
    (TOKEN_FLIGHT_DURATION_S + Math.max(0, len - 1) * TOKEN_FLIGHT_STAGGER_S) *
      1000 +
    90
  );
}

/** Max expected tokens taken per action (Splendor rules). */
const MAX_TAKE = 3;

/**
 * Conservative lower bound for take-only (no discard). The backend uses
 * `delayAfterTokenFlights(takeLen, discardLen)` to match chained bank→player and player→bank flights.
 */
export const SERVER_GAME_UPDATED_DELAY_AFTER_TOKENS_TAKEN_MS =
  tokenFlightTotalMs(MAX_TAKE) + 120;
