import type { GemColor } from "../game/models";

/** Mirrors `back-end/src/game/cardMovePayload.ts` socket payload. */
export type CardMovedSocketPayload = {
  playerId: string;
  cardId: string;
  action: "purchase" | "reserve" | "reserve_from_deck";
  colorBonus: Exclude<GemColor, GemColor.Gold>;
  cardIndex1Based: number;
  source: "board" | "reserved" | "deck";
  level?: 1 | 2 | 3;
  gaveGold: boolean;
};

export type CardFlightVisual = {
  /** Source card id — hide the real board/reserved DOM node while the overlay flies (no "duplicate" look). */
  cardId: string;
  source: "board" | "reserved" | "deck";
  level?: 1 | 2 | 3;
  colorBonus: Exclude<GemColor, GemColor.Gold>;
  cardIndex1Based: number;
  from: { left: number; top: number; width: number; height: number };
  to: { left: number; top: number; width: number; height: number };
};

function serializeRect(r: DOMRect): CardFlightVisual["from"] {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export function buildCardFlightVisual(
  payload: CardMovedSocketPayload,
): CardFlightVisual | null {
  const { cardId, source, level, action, playerId } = payload;
  let fromEl: Element | null = null;
  if (source === "board") {
    fromEl = document.querySelector(`[data-board-card="${cardId}"]`);
  } else if (source === "reserved") {
    fromEl = document.querySelector(`[data-reserved-card="${cardId}"]`);
  } else if (source === "deck" && level != null) {
    fromEl = document.querySelector(`[data-deck-level="${level}"]`);
  }
  const destSel =
    action === "purchase"
      ? `[data-card-dest="${playerId}:purchase"]`
      : `[data-card-dest="${playerId}:reserve"]`;
  const toEl = document.querySelector(destSel);
  if (!fromEl || !toEl) return null;
  return {
    cardId: payload.cardId,
    source: payload.source,
    level: payload.level,
    colorBonus: payload.colorBonus,
    cardIndex1Based: payload.cardIndex1Based,
    from: serializeRect(fromEl.getBoundingClientRect()),
    to: serializeRect(toEl.getBoundingClientRect()),
  };
}
