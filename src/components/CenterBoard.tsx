import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DevelopmentCard as DevelopmentCardModel } from "../game/models";
import { GameState, GemColor, Player } from "../game/models";
import { BoardRefillFlightOverlay } from "./BoardRefillFlightOverlay";
import { NobleTile } from "./NobleTile";
import { DevelopmentCard, Deck } from "./DevelopmentCard";
import { TokenBank } from "./TokenBank";
import { canAffordCard } from "../utils/gameView";

interface CenterBoardProps {
  gameState: GameState;
  currentPlayer: Player;
  selectedTokens: GemColor[];
  onTokenClick: (color: GemColor) => void;
  onTakeTokens: () => void;
  onClearTokens: () => void;
  onBuyCard: (id: string) => void;
  onReserveCard: (id: string) => void;
  onReserveFromDeck: (level: 1 | 2 | 3) => void;
  isDark: boolean;
  tokenInteractionDisabled?: boolean;
}

export const CenterBoard = ({
  gameState,
  currentPlayer,
  selectedTokens,
  onTokenClick,
  onTakeTokens,
  onClearTokens,
  onBuyCard,
  onReserveCard,
  onReserveFromDeck,
  isDark,
  tokenInteractionDisabled = false,
}: CenterBoardProps) => {
  /**
   * Track previous board card IDs as a Set (not by slot-index).
   * Backend does splice+push so indices shift on every purchase/reserve — we
   * detect a refill by finding a card whose ID was NOT on the board before.
   */
  const prevBoardIdSetRef = useRef<Set<string> | null>(null);
  const [refillAnim, setRefillAnim] = useState<{
    level: 1 | 2 | 3;
    index: number;
    card: DevelopmentCardModel;
    key: string;
  } | null>(null);
  const [entranceSkipSet, setEntranceSkipSet] = useState<Set<string>>(new Set());
  const refillAnimRef = useRef(refillAnim);
  refillAnimRef.current = refillAnim;

  const boardCardWidthPx =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 640px)").matches
      ? 72
      : 52;

  useLayoutEffect(() => {
    const newIdSet = new Set<string>();
    for (const level of [1, 2, 3] as const) {
      for (const card of gameState.boardCards[`level${level}`]) {
        newIdSet.add(card.id);
      }
    }

    if (prevBoardIdSetRef.current === null) {
      prevBoardIdSetRef.current = newIdSet;
      return;
    }

    const prev = prevBoardIdSetRef.current;
    let newCard: DevelopmentCardModel | null = null;
    let newLevel: 1 | 2 | 3 = 1;
    let newIndex = 0;

    outer: for (const level of [1, 2, 3] as const) {
      const row = gameState.boardCards[`level${level}`];
      for (let i = 0; i < row.length; i++) {
        if (!prev.has(row[i].id)) {
          newCard = row[i];
          newLevel = level;
          newIndex = i;
          break outer;
        }
      }
    }

    prevBoardIdSetRef.current = newIdSet;

    if (newCard) {
      setRefillAnim({
        level: newLevel,
        index: newIndex,
        card: newCard,
        key: `${newLevel}-${newIndex}-${newCard.id}`,
      });
    }
  }, [gameState]);

  useEffect(() => {
    if (entranceSkipSet.size === 0) return;
    const t = window.setTimeout(() => setEntranceSkipSet(new Set()), 120);
    return () => window.clearTimeout(t);
  }, [entranceSkipSet]);

  const handleRefillComplete = useCallback(() => {
    const cur = refillAnimRef.current;
    if (cur) setEntranceSkipSet(new Set([cur.card.id]));
    setRefillAnim(null);
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-4 order-2 lg:order-none min-w-0 ">
      {refillAnim && (
        <BoardRefillFlightOverlay
          key={refillAnim.key}
          level={refillAnim.level}
          slotIndex={refillAnim.index}
          card={refillAnim.card}
          cardWidthPx={boardCardWidthPx}
          onComplete={handleRefillComplete}
        />
      )}

      {/* Nobles */}
      <div
        className={`p-3 rounded-2xl border shadow-inner shrink-0 transition-colors flex flex-col ${isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? "text-stone-300" : "text-gray-700"}`}
          >
            Nobles
          </h3>
        </div>
        <div className="flex-1 flex justify-center items-center gap-5 sm:gap-10 ">
          {gameState.boardNobles.map((noble) => (
            <div key={noble.id}>
              <NobleTile noble={noble} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Cards Grid (Main Decks) */}
        <div
          className={`flex-1 flex flex-col gap-3 p-3 rounded-2xl border transition-colors overflow-x-auto ${isDark ? "bg-zinc-800/30 border-zinc-700/30" : "bg-white border-gray-200"} ${tokenInteractionDisabled ? "pointer-events-none" : ""}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? "text-stone-300" : "text-gray-700"}`}
            >
              Main Decks
            </h3>
          </div>
          {[3, 2, 1].map((level) => (
            <div key={level} className="grid grid-cols-5 gap-2 sm:gap-3 min-w-0 items-start">
              <Deck
                level={level as 1 | 2 | 3}
                count={
                  gameState.decks[`level${level}` as keyof typeof gameState.decks]
                    .length
                }
                onReserve={() => onReserveFromDeck(level as 1 | 2 | 3)}
                turnPhase={gameState.turnPhase}
              />
              {gameState.boardCards[
                `level${level}` as keyof typeof gameState.boardCards
              ].map((card, index) => {
                const isRefilling =
                  refillAnim?.level === level &&
                  refillAnim.index === index &&
                  refillAnim.card.id === card.id;

                if (isRefilling) {
                  return (
                    <div
                      key={`placeholder-${card.id}`}
                      data-board-slot={`${level}-${index}`}
                      className="w-full min-w-[70px] max-w-[85px] sm:min-w-[90px] sm:max-w-[130px] lg:max-w-[160px] lg:min-w-[120px] aspect-[2/3] shrink-0 rounded-xl border-2 border-dashed border-zinc-500/30 bg-zinc-900/20"
                      aria-hidden
                    />
                  );
                }

                return (
                  <div
                    key={card.id}
                    data-board-card={card.id}
                    className="min-w-0"
                  >
                    <DevelopmentCard
                      card={card}
                      affordable={canAffordCard(currentPlayer, card)}
                      turnPhase={gameState.turnPhase}
                      onBuy={() => onBuyCard(card.id)}
                      onReserve={() => onReserveCard(card.id)}
                      skipEntranceAnimation={entranceSkipSet.has(card.id)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bank / Tokens */}
        <div className="w-full">
          <TokenBank
            bank={gameState.bank}
            selectedTokens={selectedTokens}
            onTokenClick={onTokenClick}
            onTakeTokens={onTakeTokens}
            onClear={onClearTokens}
            turnPhase={gameState.turnPhase}
            isDark={isDark}
            interactionDisabled={tokenInteractionDisabled}
          />
        </div>
      </div>
    </div>
  );
};
