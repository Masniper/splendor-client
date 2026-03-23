import type { GameState } from "../game/models";
import type { GemColor } from "../game/models";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/** Bank −1, player +1 per taken gem (run when `game:tokensTaken` fires, before take flight). */
export function applyOptimisticTakeOnly(
  state: GameState,
  playerId: string,
  taken: GemColor[],
): GameState {
  if (taken.length === 0) return state;
  const next = cloneState(state);
  const player = next.players.find((p) => p.id === playerId);
  if (!player) return state;
  for (const t of taken) {
    next.bank[t] = Math.max(0, (next.bank[t] ?? 0) - 1);
    player.ownedTokens[t] = (player.ownedTokens[t] ?? 0) + 1;
  }
  return next;
}

/** Player −1 per discarded gem when discard flight **starts** (token leaves dashboard). */
export function applyOptimisticDiscardLeavePlayer(
  state: GameState,
  playerId: string,
  discarded: GemColor[],
): GameState {
  if (discarded.length === 0) return state;
  const next = cloneState(state);
  const player = next.players.find((p) => p.id === playerId);
  if (!player) return state;
  for (const d of discarded) {
    player.ownedTokens[d] = Math.max(0, (player.ownedTokens[d] ?? 0) - 1);
  }
  return next;
}

/** Bank +1 per gem when discard flight **ends** (token lands in bank pile). */
export function applyOptimisticBankReceiveDiscard(
  state: GameState,
  discarded: GemColor[],
): GameState {
  if (discarded.length === 0) return state;
  const next = cloneState(state);
  for (const d of discarded) {
    next.bank[d] = (next.bank[d] ?? 0) + 1;
  }
  return next;
}
