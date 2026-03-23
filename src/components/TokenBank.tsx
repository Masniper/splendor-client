import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GemColor, TurnPhase } from "../game/models";
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

interface TokenBankProps {
  bank: Record<GemColor, number>;
  selectedTokens: GemColor[];
  onTokenClick: (color: GemColor) => void;
  onTakeTokens: () => void;
  onClear: () => void;
  turnPhase: TurnPhase;
  isDark: boolean;
  interactionDisabled?: boolean;
}

export const TokenBank = ({
  bank,
  selectedTokens,
  onTokenClick,
  onTakeTokens,
  onClear,
  turnPhase,
  isDark,
  interactionDisabled = false,
}: TokenBankProps) => {
  const isSmUp = useIsSmUp();
  const tokenSize = isSmUp ? 52 : 36;
  const stackGap = isSmUp ? 3.5 : 2.5;
  const liftBase = isSmUp ? 12 : 9;
  const liftStep = isSmUp ? 5 : 4;
  const maxLiftHeadroom = liftBase + liftStep + 12;

  const actionButtons = (
    <div
      className={`flex items-center gap-2 transition-all duration-150 ${selectedTokens.length > 0 ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"}`}
    >
      <button
        type="button"
        disabled={interactionDisabled}
        onClick={onClear}
        className={`text-[9px] sm:text-[10px] px-3 py-1.5 rounded-full transition-colors font-sans whitespace-nowrap ${isDark ? "bg-zinc-700 text-stone-300 hover:bg-zinc-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} disabled:opacity-40 disabled:pointer-events-none`}
      >
        Clear
      </button>
      <button
        type="button"
        disabled={interactionDisabled}
        onClick={onTakeTokens}
        className="text-[9px] sm:text-[10px] px-3 py-1.5 bg-emerald-600 font-bold rounded-full hover:bg-emerald-500 shadow-md transition-all active:scale-95 text-white font-sans whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none"
      >
        Take Tokens
      </button>
    </div>
  );

  return (
    <div
      className={`p-3 rounded-2xl border shadow-inner transition-colors ${isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-white/70 border-gray-200/70"}`}
    >
      {/* Header row: title + action buttons inline */}
      <div className="flex items-center justify-between mb-2 min-h-[32px]">
        <h3
          className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? "text-stone-300" : "text-gray-700"}`}
        >
          Bank
        </h3>
        {actionButtons}
      </div>

      {/* Token piles — always horizontal row */}
      <div className="flex flex-row items-end justify-evenly gap-2 sm:gap-4 py-2">
        {(Object.keys(bank) as GemColor[]).map((color) => {
          const amount = bank[color];
          const selectionCount = selectedTokens.filter((c) => c === color).length;
          const visible = Math.min(Math.max(amount, 0), MAX_VISIBLE_STACK);
          const pileHeight =
            visible <= 0 ? tokenSize : tokenSize + (visible - 1) * stackGap;
          const pileWidth = tokenSize + 4;
          const pickedFromTop = Math.min(selectionCount, visible);

          return (
            <button
              key={color}
              data-bank-pile={color}
              type="button"
              onClick={() => onTokenClick(color)}
              disabled={
                interactionDisabled ||
                color === GemColor.Gold ||
                amount === 0 ||
                turnPhase !== "MainAction"
              }
              style={{ width: pileWidth }}
              className={`flex flex-col items-center justify-end shrink-0 rounded-2xl transition-colors relative font-sans overflow-visible min-h-0
                ${isDark ? "bg-zinc-900/20" : "bg-stone-100/40"}
                ${color === GemColor.Gold || turnPhase !== "MainAction" ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}
                shadow-sm hover:brightness-[1.03] active:brightness-[0.98]
              `}
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
                      selectionCount > 0 && idx >= visible - pickedFromTop;
                    const pickTier = isPicked ? idx - (visible - pickedFromTop) : 0;
                    const liftY = isPicked ? -(liftBase + pickTier * liftStep) : 0;

                    return (
                      <motion.span
                        key={`${color}-${idx}`}
                        className={`absolute left-1/2 block rounded-full shrink-0 -translate-x-1/2 shadow-sm ${isPicked ? "ring-2 ring-emerald-400/95" : ""}`}
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
                        role={idx === visible - 1 ? "img" : undefined}
                        aria-label={idx === visible - 1 ? color : undefined}
                        aria-hidden={idx === visible - 1 ? undefined : true}
                      />
                    );
                  })
                )}
                </div>
              </div>
              <span
                className={`mt-0.5 text-[10px] sm:text-xs font-bold tabular-nums leading-none ${isDark ? "text-stone-400" : "text-zinc-600"}`}
              >
                {amount}
              </span>
              {selectionCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-emerald-500 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-md z-40">
                  {selectionCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
