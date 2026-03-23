import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GemColor } from "../game/models";
import { gemTokenSpriteStyle } from "../constants";

const MAX_VISIBLE_STACK = 7;

const springTransition = { type: "spring" as const, stiffness: 380, damping: 28 };

function useIsSmUp() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const go = () => setV(mq.matches);
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, []);
  return v;
}

type DiscardTokenPickerProps = {
  /** Current holdings per color (simulated counts while modal open). */
  holdings: Record<GemColor, number>;
  discardSelection: GemColor[];
  onToggle: (color: GemColor) => void;
  isDark: boolean;
};

/**
 * Bank-style stacked gem discs for choosing tokens to discard (player → bank).
 */
export function DiscardTokenPicker({
  holdings,
  discardSelection,
  onToggle,
  isDark,
}: DiscardTokenPickerProps) {
  const isSmUp = useIsSmUp();
  const tokenSize = isSmUp ? 52 : 36;
  const stackGap = isSmUp ? 3.5 : 2.5;
  const liftBase = isSmUp ? 12 : 9;
  const liftStep = isSmUp ? 5 : 4;
  const maxLiftHeadroom = liftBase + liftStep + 12;

  const tokenColors = [
    GemColor.Diamond,
    GemColor.Sapphire,
    GemColor.Emerald,
    GemColor.Ruby,
    GemColor.Onyx,
    GemColor.Gold,
  ];

  return (
    <div className="flex flex-row flex-wrap items-end justify-center gap-3 sm:gap-4">
      {tokenColors.map((color) => {
        const amount = holdings[color] ?? 0;
        const discardedCount = discardSelection.filter((c) => c === color).length;
        const visible = Math.min(Math.max(amount, 0), MAX_VISIBLE_STACK);
        const pileHeight =
          visible <= 0 ? tokenSize : tokenSize + (visible - 1) * stackGap;
        const pileWidth = tokenSize + 4;
        const pickedFromTop = Math.min(discardedCount, visible);

        const disabled =
          amount === 0 || discardedCount >= amount;

        return (
          <button
            key={color}
            type="button"
            data-discard-pile={color}
            onClick={() => !disabled && onToggle(color)}
            disabled={disabled}
            style={{ width: pileWidth }}
            className={`flex flex-col items-center justify-end shrink-0 rounded-2xl transition-colors relative font-sans overflow-visible min-h-0
              ${isDark ? "bg-zinc-900/20" : "bg-stone-100/40"}
              ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer shadow-sm hover:brightness-[1.03] active:brightness-[0.98]"}`}
          >
            <div
              className="flex w-full flex-col justify-end overflow-visible shrink-0"
              style={{
                width: pileWidth,
                height: pileHeight + maxLiftHeadroom,
              }}
            >
              <div
                className="relative shrink-0 overflow-visible"
                style={{ height: pileHeight, width: pileWidth }}
              >
                {visible === 0 ? (
                  <span
                    className={`block rounded-full shrink-0 opacity-25 ${isDark ? "bg-zinc-600" : "bg-zinc-300"}`}
                    style={{ width: tokenSize, height: tokenSize }}
                    aria-hidden
                  />
                ) : (
                  Array.from({ length: visible }, (_, idx) => {
                    const depthFromFront = visible - 1 - idx;
                    const top = depthFromFront * stackGap;
                    const isPicked =
                      discardedCount > 0 && idx >= visible - pickedFromTop;
                    const pickTier = isPicked ? idx - (visible - pickedFromTop) : 0;
                    const liftY = isPicked ? -(liftBase + pickTier * liftStep) : 0;

                    return (
                      <motion.span
                        key={`${color}-${idx}`}
                        className={`absolute left-1/2 block rounded-full shrink-0 -translate-x-1/2 shadow-sm ${isPicked ? "ring-2 ring-rose-400/95" : ""}`}
                        style={{
                          top,
                          zIndex: isPicked ? 30 + pickTier : idx + 1,
                          ...gemTokenSpriteStyle(color, tokenSize),
                        }}
                        initial={false}
                        animate={{
                          y: liftY,
                          scale: isPicked ? 1.08 : 1,
                          filter: isPicked
                            ? "drop-shadow(0 10px 14px rgba(0,0,0,0.4))"
                            : "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                        }}
                        transition={springTransition}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <span
              className={`mt-0.5 text-[10px] sm:text-xs font-bold tabular-nums leading-none ${isDark ? "text-stone-400" : "text-zinc-600"}`}
            >
              {amount - discardedCount}
            </span>
            {discardedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-rose-500 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-md z-40">
                −{discardedCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
