import { motion, AnimatePresence } from "framer-motion";
import { GemColor } from "../game/models";
import { gemTokenSpriteStyle } from "../constants";

export type TokenFlightItem = {
  id: string;
  color: GemColor;
  from: { left: number; top: number; width: number; height: number };
  to: { left: number; top: number; width: number; height: number };
};

type TokenFlightOverlayProps = {
  items: TokenFlightItem[];
  tokenSizePx: number;
};

/**
 * Fixed-layer flying token discs (bank → player). Rects are captured in viewport space before layout changes.
 * Parent clears `items` after a timeout aligned with duration + stagger.
 */
export function TokenFlightOverlay({ items, tokenSizePx }: TokenFlightOverlayProps) {
  const stagger = 0.075;
  const duration = 0.52;
  const half = tokenSizePx / 2;

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-[80]"
          aria-hidden
        >
          {items.map((item, index) => {
            const sx = item.from.left + item.from.width / 2 - half;
            const sy = item.from.top + item.from.height / 2 - half;
            const ex = item.to.left + item.to.width / 2 - half;
            const ey = item.to.top + item.to.height / 2 - half;
            return (
              <motion.div
                key={item.id}
                className="absolute rounded-full shadow-md"
                style={{
                  width: tokenSizePx,
                  height: tokenSizePx,
                  ...gemTokenSpriteStyle(item.color, tokenSizePx),
                }}
                initial={{ left: sx, top: sy, opacity: 1, scale: 1 }}
                animate={{ left: ex, top: ey, opacity: 1, scale: 0.92 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration,
                  delay: index * stagger,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

export const TOKEN_FLIGHT_DURATION_S = 0.52;
export const TOKEN_FLIGHT_STAGGER_S = 0.075;
