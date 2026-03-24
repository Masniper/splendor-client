import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
  type MouseEvent,
} from "react";
import { motion } from "framer-motion";
import {
  DevelopmentCard as IDevelopmentCard,
  GemColor,
  TurnPhase,
} from "../game/models";
import { cardImageFallback, cardImageSrc } from "../utils/cardAssets";
import { useElementSize } from "../hooks/useElementSize";
import { usePurchaseCardNeon } from "../hooks/usePurchaseCardNeon";
import {
  cardCostCircleStyle,
  cardDeckBackStyle,
  cardSheetFaceStyle,
  costMinigemStyle,
  gemBonusHeaderStyle,
  numbersSheetDigitStyle,
  parseCardSheetIndex1Based,
  prestigePointsSpriteStyle,
} from "../utils/splendorSprites";
import { PurchaseCardNeonBorder } from "./PurchaseCardNeonBorder";

function CardFaceImage({ cardId }: { cardId: string }) {
  const [src, setSrc] = useState(() => cardImageSrc(cardId));

  useEffect(() => {
    setSrc(cardImageSrc(cardId));
  }, [cardId]);

  return (
    <img
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() =>
        setSrc((prev) =>
          prev === cardImageFallback(cardId) ? prev : cardImageFallback(cardId),
        )
      }
    />
  );
}

interface CardProps {
  card: IDevelopmentCard;
  onBuy?: () => void;
  onReserve?: () => void;
  affordable: boolean;
  turnPhase: TurnPhase;
  isReserved?: boolean;
  /** Skip mount fade/slide (e.g. after deck→slot refill animation). */
  skipEntranceAnimation?: boolean;
}

export const DevelopmentCard = (props: CardProps) => {
  const {
    card,
    onBuy,
    onReserve,
    affordable,
    turnPhase,
    isReserved = false,
    skipEntranceAnimation = false,
  } = props;
  const [showMenu, setShowMenu] = useState(false);
  const cardBoxRef = useRef<HTMLDivElement>(null);
  const { width: cardBoxW, height: cardBoxH } = useElementSize(cardBoxRef);

  const levelBorders = {
    1: "border-emerald-700",
    2: "border-amber-600",
    3: "border-blue-700",
  };

  const isPurchasable = affordable && turnPhase === "MainAction";
  const neon = usePurchaseCardNeon({
    colorBonus: card.colorBonus,
    level: card.level,
  });

  const handleCardClick = () => {
    setShowMenu(!showMenu);
  };

  const handleBuyClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onBuy?.();
      setShowMenu(false);
    },
    [onBuy],
  );

  const handleReserveClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onReserve?.();
      setShowMenu(false);
    },
    [onReserve],
  );

  const cardSheetIndex = parseCardSheetIndex1Based(card.id);

  return (
    <motion.div
      ref={cardBoxRef}
      onClick={handleCardClick}
      onMouseLeave={() => setShowMenu(false)}
      initial={skipEntranceAnimation ? false : { opacity: 0, y: 20 }}
      animate={
        isPurchasable
          ? {
              opacity: 1,
              y: 0,
              borderColor: "transparent",
              transition: { duration: 0.15 },
            }
          : {
              opacity: 1,
              y: 0,
              borderColor: neon.defaultBorderColor,
              transition: { duration: 0.15 },
            }
      }
      style={isPurchasable ? { boxShadow: neon.neonBoxShadowStatic } : undefined}
      className={`w-full min-w-[70px] max-w-[85px] sm:min-w-[90px] sm:max-w-[130px] lg:max-w-[160px] lg:min-w-[120px] aspect-[2/3] shrink-0 rounded-xl border-2 ${
        isPurchasable ? "border-transparent" : levelBorders[card.level]
      } p-0 flex flex-col justify-between ${isPurchasable ? "shadow-none" : "shadow-md"} relative group ${
        isPurchasable ? "overflow-visible" : "overflow-hidden"
      } transition-shadow cursor-pointer`}
    >
      {isPurchasable && (
        <PurchaseCardNeonBorder
          clipPathId={neon.lightningClipPathId}
          borderRect={neon.borderRect}
          outerStroke={neon.outerStroke}
          innerStroke={neon.innerStroke}
          outerStrokeKeyframes={neon.outerStrokeKeyframes}
          innerStrokeKeyframes={neon.innerStrokeKeyframes}
          reduceMotion={neon.reduceMotion}
          outerColorCycleDurationSec={neon.outerColorCycleDurationSec}
          innerColorCycleDurationSec={neon.innerColorCycleDurationSec}
        />
      )}

      <div className="relative h-full w-full overflow-hidden rounded-xl flex flex-col">
        {cardSheetIndex != null ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={cardSheetFaceStyle(
              card.colorBonus,
              cardSheetIndex,
              cardBoxW,
              cardBoxH,
            )}
          />
        ) : (
          <CardFaceImage cardId={card.id} />
        )}
        <div className="relative z-10 bg-white/30 backdrop-blur-md p-1 sm:p-1.5 flex justify-between items-start border-b border-white/20 rounded-t-xl">
          <div className="flex shrink-0 items-start justify-center">
            {card.prestigePoints > 0 &&
              (() => {
                const vpSm = prestigePointsSpriteStyle(card.prestigePoints, 18);
                const vpMd = prestigePointsSpriteStyle(card.prestigePoints, 26);
                const vpLg = prestigePointsSpriteStyle(card.prestigePoints, 34);
                if (vpSm) {
                  return (
                    <>
                      <span
                        className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] sm:hidden"
                        style={vpSm}
                      />
                      <span
                        className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden sm:inline-block lg:hidden"
                        style={vpMd}
                      />
                      <span
                        className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden lg:inline-block"
                        style={vpLg}
                      />
                    </>
                  );
                }
                return (
                  <span className="min-w-[1rem] text-center text-sm font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] sm:min-w-[1.2rem] sm:text-lg lg:min-w-[1.5rem] lg:text-2xl">
                    {card.prestigePoints}
                  </span>
                );
              })()}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span
              className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] sm:hidden"
              style={gemBonusHeaderStyle(card.colorBonus, 24)}
            />
            <span
              className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden sm:inline-block lg:hidden"
              style={gemBonusHeaderStyle(card.colorBonus, 40)}
            />
            <span
              className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden lg:inline-block"
              style={gemBonusHeaderStyle(card.colorBonus, 48)}
            />
          </div>
        </div>

        <div className="relative z-10 mt-auto mb-1 flex w-fit flex-col gap-0.5 p-1 sm:gap-1 sm:p-1.5">
          {(Object.keys(card.cost) as GemColor[]).map((color) => {
            const amount = card.cost[color];
            if (!amount || color === GemColor.Gold) return null;
            const gem = color as Exclude<GemColor, GemColor.Gold>;
            const costSm = 16;
            const costMd = 26;
            const costLg = 30;
            const digitSm = numbersSheetDigitStyle(amount, costSm);
            const digitMd = numbersSheetDigitStyle(amount, costMd);
            const digitLg = numbersSheetDigitStyle(amount, costLg);
            return (
              <div key={color} className="flex items-center">
                <div
                  className="relative shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:hidden"
                  style={{ width: costSm, height: costSm }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={cardCostCircleStyle(gem, costSm)}
                  />
                  {digitSm && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={digitSm}
                    />
                  )}
                  <div style={costMinigemStyle(gem, costSm, "card")} />
                </div>
                <div
                  className="relative hidden shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:block lg:hidden"
                  style={{ width: costMd, height: costMd }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={cardCostCircleStyle(gem, costMd)}
                  />
                  {digitMd && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={digitMd}
                    />
                  )}
                  <div style={costMinigemStyle(gem, costMd, "card")} />
                </div>
                <div
                  className="relative hidden shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] lg:block"
                  style={{ width: costLg, height: costLg }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={cardCostCircleStyle(gem, costLg)}
                  />
                  {digitLg && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={digitLg}
                    />
                  )}
                  <div style={costMinigemStyle(gem, costLg, "card")} />
                </div>
              </div>
            );
          })}
        </div>

        {(onBuy || onReserve) && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 lg:gap-4 transition-opacity z-20 rounded-xl bg-black/70 backdrop-blur-sm 
            ${showMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto"}`}
          >
            {onBuy && (turnPhase === "MainAction" || isReserved) && (
              <button
                onClick={handleBuyClick}
                disabled={!affordable || turnPhase !== "MainAction"}
                className={`w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-lg shadow-md transition-transform transition-colors active:scale-95 ${
                  affordable && turnPhase === "MainAction"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.8)]"
                    : "bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed"
                }`}
              >
                Buy
              </button>
            )}
            {onReserve && !isReserved && turnPhase === "MainAction" && (
              <button
                onClick={handleReserveClick}
                className="w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/50 transition-transform transition-colors active:scale-95"
              >
                Reserve
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface DeckProps {
  level: 1 | 2 | 3;
  count: number;
  onReserve: () => void;
  turnPhase: TurnPhase;
}

function assignRef<T>(ref: ForwardedRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/**
 * Face-down deck stack — ref attaches to the outer box (same element as `data-deck-level`).
 * Used as the exact origin for board refill flights (deck → empty slot).
 */
export const Deck = forwardRef<HTMLDivElement, DeckProps>(function Deck(
  { level, count, onReserve, turnPhase },
  ref,
) {
  const [showMenu, setShowMenu] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const { width: dw, height: dh } = useElementSize(innerRef);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <div
      ref={setRefs}
      data-deck-level={level}
      onClick={() => setShowMenu(!showMenu)}
      onMouseLeave={() => setShowMenu(false)}
      className="w-full min-w-[70px] max-w-[85px] sm:min-w-[90px] sm:max-w-[130px] lg:max-w-[160px] aspect-[2/3] shrink-0 rounded-xl ring-1 ring-white/25 border-2 border-yellow-600/50 shadow-lg relative group overflow-hidden cursor-pointer bg-zinc-900"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={cardDeckBackStyle(level, dw, dh)}
      />
      <div className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-black/55 px-1 py-0.5 sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:py-0.5 font-sans text-[10px] font-bold tabular-nums text-white shadow sm:text-xs">
        {count}
      </div>

      {turnPhase === "MainAction" && count > 0 && (
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center transition-opacity z-20 
          ${showMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto"}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReserve();
              setShowMenu(false);
            }}
            className="w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/50 transition-all active:scale-95"
          >
            Reserve
          </button>
        </div>
      )}
    </div>
  );
});
