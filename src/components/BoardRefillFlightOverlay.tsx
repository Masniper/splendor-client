import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DevelopmentCard as DevelopmentCardModel } from "../game/models";
import {
  cardDeckBackStyle,
  cardSheetFaceStyle,
  parseCardSheetIndex1Based,
} from "../utils/splendorSprites";

export const BOARD_REFILL_DURATION_MS = 850;
const DURATION_S = BOARD_REFILL_DURATION_MS / 1000;

type BoardRefillFlightOverlayProps = {
  level: 1 | 2 | 3;
  slotIndex: number;
  card: DevelopmentCardModel;
  cardWidthPx: number;
  onComplete: () => void;
};

/**
 * New card flies from the face-down deck stack, flips to face-up in mid-air,
 * and lands in the empty board slot. Uses querySelector to find positions —
 * simpler and more reliable than ref forwarding across component boundaries.
 *
 * Requires:
 *  - `[data-deck-level="${level}"]` on the Deck component root div
 *  - `[data-board-slot="${level}-${slotIndex}"]` on the placeholder div in CenterBoard
 */
export function BoardRefillFlightOverlay({
  level,
  slotIndex,
  card,
  cardWidthPx,
  onComplete,
}: BoardRefillFlightOverlayProps) {
  const aspect = 2 / 3;
  const w = cardWidthPx;
  const h = Math.round(cardWidthPx / aspect);
  const [layout, setLayout] = useState<{
    sx: number;
    sy: number;
    ex: number;
    ey: number;
    midX: number;
    midY: number;
  } | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneRef = useRef(false);

  const fireComplete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  };

  useLayoutEffect(() => {
    const fromEl = document.querySelector<HTMLElement>(
      `[data-deck-level="${level}"]`,
    );
    const toEl = document.querySelector<HTMLElement>(
      `[data-board-slot="${level}-${slotIndex}"]`,
    );

    if (!fromEl || !toEl) {
      // Elements not found — skip animation, reveal card immediately
      fireComplete();
      return;
    }

    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    const sx = fr.left + fr.width / 2 - w / 2;
    const sy = fr.top + fr.height / 2 - h / 2;
    const ex = tr.left + tr.width / 2 - w / 2;
    const ey = tr.top + tr.height / 2 - h / 2;

    // Gentle lift arc — refill stays within the board area, no need for large arc
    const span = Math.hypot(ex - sx, ey - sy);
    const arcLift = Math.min(80, Math.max(24, span * 0.18 + 20));
    const midX = (sx + ex) / 2;
    const midY = Math.min(sy, ey) - arcLift;

    setLayout({ sx, sy, ex, ey, midX, midY });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, slotIndex, w, h]);

  const idx = parseCardSheetIndex1Based(card.id) ?? 1;

  if (!layout) return null;

  const { sx, sy, ex, ey, midX, midY } = layout;

  return (
    <AnimatePresence>
      <div
        className="pointer-events-none fixed inset-0 z-[92]"
        style={{ perspective: 1600 }}
        aria-hidden
      >
        <motion.div
          className="absolute rounded-lg shadow-2xl"
          style={{
            width: w,
            height: h,
            transformStyle: "preserve-3d",
          }}
          initial={{ left: sx, top: sy, rotateY: 0, scale: 1 }}
          animate={{
            left: [sx, midX, ex],
            top: [sy, midY, ey],
            rotateY: [0, 90, 180],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: DURATION_S,
            times: [0, 0.42, 1],
            ease: [0.25, 1, 0.5, 1],
          }}
          onAnimationComplete={fireComplete}
        >
          {/* Face-down (deck back) — visible at start */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
            style={cardDeckBackStyle(level, w, h)}
          />
          {/* Face-up — revealed after 90° rotation */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={cardSheetFaceStyle(card.colorBonus, idx, w, h)}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
