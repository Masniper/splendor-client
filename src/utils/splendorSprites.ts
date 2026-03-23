import type { CSSProperties } from "react";
import { GemColor } from "../game/models";

/** BGA `numbers_sheet.png`: 1400×417, 10×3 cells (see splendor-net splendor.css). */
export const NUMBERS_SHEET_URL = "/images/numbers_sheet.png";

const NUMBERS_COLS = 10;
const NUMBERS_ROWS = 3;

/** BGA gem column on numbers sheet: O, C, S, E, R → indices 0–4 (spl_noblecost / spl_cardcost). */
const gemToNumbersColumn: Record<Exclude<GemColor, GemColor.Gold>, number> = {
  [GemColor.Onyx]: 0,
  [GemColor.Diamond]: 1,
  [GemColor.Sapphire]: 2,
  [GemColor.Emerald]: 3,
  [GemColor.Ruby]: 4,
};

/** BGA `gems.png` card header bonus: 5 frames, order C, S, O, R, E on x-axis. */
export const GEMS_BONUS_URL = "/images/gems.png";
const GEMS_BONUS_FRAMES = 5;
const GEMS_NATURAL_W = 950;
const GEMS_NATURAL_H = 168;

const gemToBonusFrame: Record<Exclude<GemColor, GemColor.Gold>, number> = {
  [GemColor.Diamond]: 0,
  [GemColor.Sapphire]: 1,
  [GemColor.Onyx]: 2,
  [GemColor.Ruby]: 3,
  [GemColor.Emerald]: 4,
};

/**
 * BGA uses `background-size: 1000% 300%` (10×3 cells each exactly the box size).
 * Pixel mirror: `10S × 3S` bg, `-col*S` / `-row*S` — avoids skew from 140×139 intrinsic cells.
 */
function numbersSheetCellStyle(
  row: 0 | 1 | 2,
  col: number,
  sizePx: number,
): CSSProperties {
  const bgW = NUMBERS_COLS * sizePx;
  const bgH = NUMBERS_ROWS * sizePx;
  return {
    width: sizePx,
    height: sizePx,
    backgroundImage: `url(${NUMBERS_SHEET_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-col * sizePx}px ${-row * sizePx}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** Row 0: rounded squares (noble requirements). */
export function nobleCostSquareStyle(
  color: Exclude<GemColor, GemColor.Gold>,
  sizePx: number,
): CSSProperties {
  const col = gemToNumbersColumn[color];
  return numbersSheetCellStyle(0, col, sizePx);
}

/** Row 1: circular gems (development card costs). */
export function cardCostCircleStyle(
  color: Exclude<GemColor, GemColor.Gold>,
  sizePx: number,
): CSSProperties {
  const col = gemToNumbersColumn[color];
  return numbersSheetCellStyle(1, col, sizePx);
}

/** Row 2: stylized digits 1–10 (column index = value − 1). */
export function numbersSheetDigitStyle(
  value: number,
  sizePx: number,
): CSSProperties | null {
  if (value < 1 || value > 10) return null;
  return numbersSheetCellStyle(2, value - 1, sizePx);
}

export function prestigePointsSpriteStyle(
  points: number,
  sizePx: number,
): CSSProperties | null {
  return numbersSheetDigitStyle(points, sizePx);
}

/** Bonus gem in card header (BGA spl_cardheader_gem). */
export function gemBonusHeaderStyle(
  color: Exclude<GemColor, GemColor.Gold>,
  widthPx: number,
): CSSProperties {
  const frame = gemToBonusFrame[color];
  const frameNaturalW = GEMS_NATURAL_W / GEMS_BONUS_FRAMES;
  const scale = widthPx / frameNaturalW;
  const heightPx = (widthPx * GEMS_NATURAL_H) / frameNaturalW;
  const bgW = GEMS_NATURAL_W * scale;
  const bgH = GEMS_NATURAL_H * scale;
  return {
    width: widthPx,
    height: heightPx,
    backgroundImage: `url(${GEMS_BONUS_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-frame * widthPx}px 0`,
    backgroundRepeat: "no-repeat",
  };
}

/** BGA `cards.jpg` — `spl_card`: 500% × 600%, row by bonus color, column by art variant 1–5. */
export const CARDS_SHEET_URL = "/images/cards.jpg";

/** BGA `nobles.jpg` — `spl_noble`: 500% × 200%, 10 tiles. */
export const NOBLES_SHEET_URL = "/images/nobles.jpg";

/** BGA `oleum-small.png` — `spl_minigem` beside each cost (not the separate mobile layout). */
export const OLEUM_SMALL_URL = "/images/oleum-small.png";

const cardSheetRowByBonus: Record<Exclude<GemColor, GemColor.Gold>, number> = {
  [GemColor.Sapphire]: 0,
  [GemColor.Onyx]: 1,
  [GemColor.Ruby]: 2,
  [GemColor.Emerald]: 3,
  [GemColor.Diamond]: 4,
};

const cardSheetFallbackBg: Record<Exclude<GemColor, GemColor.Gold>, string> = {
  [GemColor.Diamond]: "#ffffff",
  [GemColor.Sapphire]: "#0000ff",
  [GemColor.Emerald]: "#adff2f",
  [GemColor.Ruby]: "#ff0000",
  [GemColor.Onyx]: "#000000",
};

/** Parses `c-12` → 12. Used to pick sprite column (BGA `spl_img_1`…`5`). */
export function parseCardSheetIndex1Based(cardId: string): number | null {
  const m = /^c-(\d+)$/i.exec(cardId.trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}

/** Parses `n-3` → 3. */
export function parseNobleSheetIndex1Based(nobleId: string): number | null {
  const m = /^n-(\d+)$/i.exec(nobleId.trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}

const CARDS_SHEET_COLS = 5;
const CARDS_SHEET_ROWS = 6;

const NOBLES_SHEET_COLS = 5;
const NOBLES_SHEET_ROWS = 2;

/**
 * BGA `spl_card`: each cell is exactly the element box; full sheet is `5W × 6H` px (avoids `%` position bugs).
 */
export function cardSheetFaceStyle(
  colorBonus: Exclude<GemColor, GemColor.Gold>,
  cardIndex1Based: number,
  elementWidthPx: number,
  elementHeightPx: number,
): CSSProperties {
  const col = (cardIndex1Based - 1) % CARDS_SHEET_COLS;
  const row = cardSheetRowByBonus[colorBonus];
  const w = Math.max(1, elementWidthPx);
  const h = Math.max(1, elementHeightPx);
  const bgW = CARDS_SHEET_COLS * w;
  const bgH = CARDS_SHEET_ROWS * h;
  return {
    backgroundColor: cardSheetFallbackBg[colorBonus],
    backgroundImage: `url(${CARDS_SHEET_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-col * w}px ${-row * h}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** BGA `spl_back_1`…`3`: bottom row of `cards.jpg` (row index 5), columns 0–2 = deck levels 1–3. */
export function cardDeckBackStyle(
  level: 1 | 2 | 3,
  elementWidthPx: number,
  elementHeightPx: number,
): CSSProperties {
  const col = level - 1;
  const row = CARDS_SHEET_ROWS - 1;
  const w = Math.max(1, elementWidthPx);
  const h = Math.max(1, elementHeightPx);
  const bgW = CARDS_SHEET_COLS * w;
  const bgH = CARDS_SHEET_ROWS * h;
  return {
    backgroundImage: `url(${CARDS_SHEET_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-col * w}px ${-row * h}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** Same idea as `cardSheetFaceStyle` for `nobles.jpg` (5×2 grid). */
export function nobleSheetFaceStyle(
  nobleIndex1Based: number,
  elementWidthPx: number,
  elementHeightPx: number,
): CSSProperties {
  const idx = nobleIndex1Based - 1;
  const col = idx % NOBLES_SHEET_COLS;
  const row = Math.floor(idx / NOBLES_SHEET_COLS);
  const w = Math.max(1, elementWidthPx);
  const h = Math.max(1, elementHeightPx);
  const bgW = NOBLES_SHEET_COLS * w;
  const bgH = NOBLES_SHEET_ROWS * h;
  return {
    backgroundColor: "#ffebcd",
    backgroundImage: `url(${NOBLES_SHEET_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-col * w}px ${-row * h}px`,
    backgroundRepeat: "no-repeat",
  };
}

/** `oleum-small.png`: 600×107, 5 frames (C,S,O,R,E) — same order as `gemToBonusFrame`. */
const OLEUM_NATURAL_W = 600;
const OLEUM_NATURAL_H = 107;
const OLEUM_FRAMES = 5;

/**
 * Small gem icon overlapping the cost cell (BGA `spl_minigem`).
 * Pixel strip like bank tokens — avoids `%` background bugs.
 */
export function costMinigemStyle(
  costColor: Exclude<GemColor, GemColor.Gold>,
  costCellSizePx: number,
  variant: "card" | "noble",
): CSSProperties {
  const base = variant === "card" ? 40 : 30;
  const frame = gemToBonusFrame[costColor];
  const frameNatW = OLEUM_NATURAL_W / OLEUM_FRAMES;
  const displayW = (16 / base) * costCellSizePx;
  const displayH = (OLEUM_NATURAL_H / frameNatW) * displayW;
  const scale = displayW / frameNatW;
  const bgW = OLEUM_NATURAL_W * scale;
  const bgH = OLEUM_NATURAL_H * scale;
  const right = (-8 / base) * costCellSizePx;
  const top =
    variant === "noble"
      ? (8 / base) * costCellSizePx
      : (17.5 / base) * costCellSizePx;
  return {
    position: "absolute",
    width: displayW,
    height: displayH,
    right,
    top,
    zIndex: 1,
    pointerEvents: "none",
    backgroundImage: `url(${OLEUM_SMALL_URL})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-frame * displayW}px 0`,
    backgroundRepeat: "no-repeat",
  };
}
