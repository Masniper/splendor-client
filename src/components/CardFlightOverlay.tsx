import { AnimatePresence, motion } from "framer-motion";
import { cardDeckBackStyle, cardSheetFaceStyle } from "../utils/splendorSprites";
import type { CardFlightVisual } from "../utils/cardFlight";

export const CARD_FLIGHT_DURATION_MS = 720;
const CARD_FLIGHT_DURATION_S = CARD_FLIGHT_DURATION_MS / 1000;

type CardFlightOverlayProps = {
  visual: CardFlightVisual;
  cardWidthPx: number;
};

/**
 * Board / deck / reserved → player area.
 * Flies in a straight line with the same easing as token flights — no arc.
 * For deck-sourced cards (reserveFromDeck) the card starts face-down and flips
 * 180° to face-up as it travels.
 */
export function CardFlightOverlay({ visual, cardWidthPx }: CardFlightOverlayProps) {
  const aspect = 2 / 3;
  const w = cardWidthPx;
  const h = Math.round(cardWidthPx / aspect);
  const { from, to } = visual;
  const sx = from.left + from.width / 2 - w / 2;
  const sy = from.top + from.height / 2 - h / 2;
  const ex = to.left + to.width / 2 - w / 2;
  const ey = to.top + to.height / 2 - h / 2;

  const fromDeck = visual.source === "deck" && visual.level != null;

  return (
    <AnimatePresence>
      <div
        className="pointer-events-none fixed inset-0 z-[85]"
        style={{ perspective: 1600 }}
        aria-hidden
      >
        <motion.div
          className="absolute rounded-lg shadow-2xl ring-2 ring-black/30"
          style={{
            width: w,
            height: h,
            transformStyle: fromDeck ? "preserve-3d" : undefined,
            ...(fromDeck
              ? {}
              : cardSheetFaceStyle(
                  visual.colorBonus,
                  visual.cardIndex1Based,
                  w,
                  h,
                )),
          }}
          initial={{ left: sx, top: sy, opacity: 1, scale: 1, rotateY: 0 }}
          animate={{
            left: ex,
            top: ey,
            opacity: 1,
            scale: 0.9,
            rotateY: fromDeck ? 180 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: CARD_FLIGHT_DURATION_S,
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          {fromDeck && visual.level != null ? (
            <>
              <div
                className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
                style={cardDeckBackStyle(visual.level, w, h)}
              />
              <div
                className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={cardSheetFaceStyle(
                  visual.colorBonus,
                  visual.cardIndex1Based,
                  w,
                  h,
                )}
              />
            </>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
