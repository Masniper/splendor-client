import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music, Volume2, VolumeX } from "lucide-react";
import { CenterBoard } from "../components/CenterBoard";
import { GameOverModal } from "../components/GameOverModal";
import { HowToPlayModal } from "../components/HowToPlayModal";
import { NobleTile } from "../components/NobleTile";
import { OpponentProfileModal } from "../components/OpponentProfileModal";
import { PlayerDashboard } from "../components/PlayerDashboard";
import { GameState, GemColor } from "../game/models";
import { useOpponentProfile } from "../hooks/useOpponentProfile";
import { DiscardTokenPicker } from "../components/DiscardTokenPicker";
import { RoomChatPanel } from "../components/RoomChatPanel";
import {
  TokenFlightOverlay,
  type TokenFlightItem,
} from "../components/TokenFlightOverlay";
import { CardFlightOverlay } from "../components/CardFlightOverlay";
import type { CardFlightVisual } from "../utils/cardFlight";
import { useGameAudio } from "../context/GameAudioContext";

type PendingDiscardAction =
  | { type: "TAKE_TOKENS"; tokens: GemColor[] }
  | { type: "RESERVE_CARD"; cardId: string; willReceiveGold: boolean }
  | {
      type: "RESERVE_FROM_DECK";
      level: 1 | 2 | 3;
      willReceiveGold: boolean;
    };

type GamePageProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogout?: () => void;

  roomCode: string;
  gameState: GameState;
  rematchState: any;
  gameOverInfo?: {
    reason?: string;
    winnerStats?: {
      coins: number;
      winRate: number;
      xp?: number;
      wins?: number;
      losses?: number;
    } | null;
    loserStats?: Array<{
      userId: string;
      coinsLost: number;
      coins: number;
      xp: number;
      wins: number;
      losses: number;
      winRate: number;
    }>;
  } | null;
  localPlayerName: string;
  localUserId?: string | null;
  /** Toast when a chat message arrives while the in-game chat sidebar is closed. */
  onChatBackgroundNotify?: (payload: { username: string; text: string }) => void;
  pendingDisconnect: any;
  pendingDisconnects: any[];

  onReconnectToRoom: (roomCode: string) => void;
  onExitAfterDisconnect: () => void;

  /** Bank → player token flight; driven by `game:tokensTaken` for all clients */
  tokenFlightVisual: { items: TokenFlightItem[]; sizePx: number } | null;

  /** Board / deck / reserved → player area; driven by `game:cardMoved` */
  cardFlightVisual: CardFlightVisual | null;

  /** True while any card animation (flight + refill) is running — blocks board interactions. */
  boardAnimating: boolean;

  actions: {
    sendAction: (action: any) => void;
    requestRematch: () => void;
    leaveRoom: (
      emit?: boolean,
      options?: { clearStoredSession?: boolean },
    ) => void;
  };
};

export function GamePage(props: GamePageProps) {
  const {
    theme,
    onThemeToggle,
    onLogout,
    roomCode,
    gameState,
    rematchState,
    gameOverInfo,
    localPlayerName,
    localUserId = null,
    onChatBackgroundNotify,
    pendingDisconnect,
    pendingDisconnects,
    onReconnectToRoom,
    onExitAfterDisconnect,
    tokenFlightVisual,
    cardFlightVisual,
    boardAnimating,
    actions,
  } = props;

  const { play, muted, toggleMuted, startMusic, stopMusic, musicTrack, setMusicTrack, musicTracks } = useGameAudio();
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const musicPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMusicPicker) return;
    const handler = (e: MouseEvent) => {
      if (musicPickerRef.current && !musicPickerRef.current.contains(e.target as Node)) {
        setShowMusicPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMusicPicker]);
  const isDark = theme === "dark";
  const [showRules, setShowRules] = useState(false);
  const {
    profile: opponentProfile,
    isOpen: isOpponentModalOpen,
    isLoading: isOpponentLoading,
    error: opponentError,
    openOpponentProfile,
    closeOpponentProfile,
  } = useOpponentProfile();

  // Reconnect modal UI state stays local to game page
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [disconnectedRoomCode, setDisconnectedRoomCode] = useState<string | null>(
    null,
  );
  const [reconnectCountdown, setReconnectCountdown] = useState<number>(120);

  // Start background music when game is active; stop when game ends or component unmounts
  useEffect(() => {
    if (!gameState.winner) {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.winner]);

  // Tick for timers rendered from expiresAt
  const [nowTick, setNowTick] = useState(() => Date.now());
  const shouldRunReconnectTimers =
    Boolean(pendingDisconnect) || (pendingDisconnects?.length ?? 0) > 1;
  useEffect(() => {
    if (!shouldRunReconnectTimers) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [shouldRunReconnectTimers]);

  // Refs for auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Game local UI state
  const [selectedTokens, setSelectedTokens] = useState<GemColor[]>([]);
  const [discardSelection, setDiscardSelection] = useState<GemColor[]>([]);
  const [pendingDiscardAction, setPendingDiscardAction] =
    useState<PendingDiscardAction | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(true);

  // Reset local selections when state updates to avoid stale data
  useEffect(() => {
    setSelectedTokens([]);
    setDiscardSelection([]);
  }, [gameState]);

  const players = gameState.players;
  const currentPlayer = players[gameState.currentPlayerIndex];
  const isLocalTurn = currentPlayer.name === localPlayerName;
  const isDiscardPhase = gameState.turnPhase === "DiscardTokens" && isLocalTurn;

  // Show/hide the discard modal when it's our turn to discard, but allow the player to close it
  useEffect(() => {
    const isDiscard =
      gameState.turnPhase === "DiscardTokens" &&
      currentPlayer?.name === localPlayerName;
    setShowDiscardModal(isDiscard);
  }, [
    gameState.turnPhase,
    gameState.currentPlayerIndex,
    localPlayerName,
    currentPlayer?.name,
  ]);

  // Auto-scroll to current player when turn changes.
  // Deferred until boardAnimating is false so the scroll doesn't fire
  // mid-card-animation (which would jolt the view while the refill is playing).
  useEffect(() => {
    if (boardAnimating) return;
    if (scrollContainerRef.current) {
      const activePlayerElement =
        playerRefs.current[gameState.currentPlayerIndex];
      if (activePlayerElement) {
        activePlayerElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [gameState.currentPlayerIndex, boardAnimating]);

  const formatMs = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getAvailableOwnedTokens = () => {
    const current = gameState.players[gameState.currentPlayerIndex];
    const baseTokens = { ...current.ownedTokens } as Record<GemColor, number>;

    if (!pendingDiscardAction) return baseTokens;

    const simulated = { ...baseTokens };
    if (pendingDiscardAction.type === "TAKE_TOKENS") {
      for (const t of pendingDiscardAction.tokens) {
        simulated[t] = (simulated[t] || 0) + 1;
      }
    } else if (
      (pendingDiscardAction.type === "RESERVE_CARD" ||
        pendingDiscardAction.type === "RESERVE_FROM_DECK") &&
      pendingDiscardAction.willReceiveGold
    ) {
      simulated[GemColor.Gold] = (simulated[GemColor.Gold] || 0) + 1;
    }

    return simulated;
  };

  const getTotalTokens = (player: any) =>
    (Object.values(player.ownedTokens).reduce((a: any, b: any) => a + b, 0) ??
      0) as number;

  const getSimulatedTotalTokens = () => {
    const availableTokens = getAvailableOwnedTokens();
    return (Object.values(availableTokens).reduce((a: any, b: any) => a + b, 0) ??
      0) as number;
  };

  const getRequiredDiscardCount = () => Math.max(0, getSimulatedTotalTokens() - 10);

  const toggleTokenSelection = (color: GemColor) => {
    if (color === GemColor.Gold) return;
    const count = selectedTokens.filter((c) => c === color).length;
    if (count >= 2) return;
    play("gemPick");
    setSelectedTokens([...selectedTokens, color]);
  };

  const toggleDiscardSelection = (color: GemColor) => {
    const availableTokens = getAvailableOwnedTokens();
    const currentCount = discardSelection.filter((c) => c === color).length;

    if (currentCount > 0) {
      const indexToRemove = discardSelection.indexOf(color);
      const newSelection = [...discardSelection];
      newSelection.splice(indexToRemove, 1);
      setDiscardSelection(newSelection);
    } else if (currentCount < (availableTokens[color] || 0)) {
      play("gemPick");
      setDiscardSelection([...discardSelection, color]);
    }
  };

  const closeDiscardModal = () => {
    setShowDiscardModal(false);
    setPendingDiscardAction(null);
    setDiscardSelection([]);
  };

  const handleTakeTokens = () => {
    const totalBefore = getTotalTokens(
      gameState.players[gameState.currentPlayerIndex],
    );
    const totalAfter = totalBefore + selectedTokens.length;
    const overflow = Math.max(0, totalAfter - 10);

    if (overflow > 0) {
      play("card");
      setPendingDiscardAction({ type: "TAKE_TOKENS", tokens: selectedTokens });
      setDiscardSelection([]);
      setShowDiscardModal(true);
      return;
    }

    play("actionSubmit");
    actions.sendAction({ type: "TAKE_TOKENS", payload: { tokens: selectedTokens } });
    setSelectedTokens([]);
  };

  const handleReserveCard = (cardId: string) => {
    const current = gameState.players[gameState.currentPlayerIndex];
    const willReceiveGold = gameState.bank[GemColor.Gold] > 0;
    const totalAfter = getTotalTokens(current) + (willReceiveGold ? 1 : 0);

    if (totalAfter > 10) {
      play("card");
      setPendingDiscardAction({ type: "RESERVE_CARD", cardId, willReceiveGold });
      setDiscardSelection([]);
      setShowDiscardModal(true);
      return;
    }

    play("reserve");
    actions.sendAction({ type: "RESERVE_CARD", payload: { cardId } });
  };

  const handleReserveFromDeck = (level: 1 | 2 | 3) => {
    const current = gameState.players[gameState.currentPlayerIndex];
    const willReceiveGold = gameState.bank[GemColor.Gold] > 0;
    const totalAfter = getTotalTokens(current) + (willReceiveGold ? 1 : 0);

    if (totalAfter > 10) {
      play("card");
      setPendingDiscardAction({ type: "RESERVE_FROM_DECK", level, willReceiveGold });
      setDiscardSelection([]);
      setShowDiscardModal(true);
      return;
    }

    play("reserve");
    actions.sendAction({ type: "RESERVE_FROM_DECK", payload: { level } });
  };

  const handleConfirmDiscard = () => {
    const requiredDiscardCount = getRequiredDiscardCount();
    if (discardSelection.length !== requiredDiscardCount) return;

    if (pendingDiscardAction) {
      if (pendingDiscardAction.type === "TAKE_TOKENS") {
        play("discard");
        actions.sendAction({
          type: "TAKE_TOKENS",
          payload: {
            tokens: pendingDiscardAction.tokens,
            discardTokens: discardSelection,
          },
        });
        setSelectedTokens([]);
      } else if (pendingDiscardAction.type === "RESERVE_CARD") {
        play("discard");
        actions.sendAction({
          type: "RESERVE_CARD",
          payload: { cardId: pendingDiscardAction.cardId, discardTokens: discardSelection },
        });
      } else if (pendingDiscardAction.type === "RESERVE_FROM_DECK") {
        play("discard");
        actions.sendAction({
          type: "RESERVE_FROM_DECK",
          payload: { level: pendingDiscardAction.level, discardTokens: discardSelection },
        });
      }
      setPendingDiscardAction(null);
    } else {
      play("discard");
      actions.sendAction({ type: "DISCARD_TOKENS", payload: { tokens: discardSelection } });
    }

    setDiscardSelection([]);
    setShowDiscardModal(false);
  };

  const availableTokens = getAvailableOwnedTokens();
  const simulatedTotalTokens = getSimulatedTotalTokens();
  const requiredDiscardCount = getRequiredDiscardCount();

  return (
    <div className="relative min-h-screen">
      {tokenFlightVisual && (
        <TokenFlightOverlay
          items={tokenFlightVisual.items}
          tokenSizePx={tokenFlightVisual.sizePx}
        />
      )}
      {cardFlightVisual && (
        <CardFlightOverlay
          visual={cardFlightVisual}
          cardWidthPx={
            typeof window !== "undefined" &&
            window.matchMedia("(min-width: 640px)").matches
              ? 72
              : 52
          }
        />
      )}
      {/* Fixed layer: avoids `background-attachment: fixed` on the scrolling root (very costly on mobile). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(${
            isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.16)"
          }, ${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.16)"}), url('/images/game-bg.jpg')`,
        }}
      />
      <div
        className={`min-h-screen w-full overflow-y-auto transition-colors duration-500 p-2 sm:p-4 lg:p-8 pt-14 sm:pt-16 font-sans flex flex-col ${
          isDark ? "text-stone-100" : "text-gray-800"
        }`}
      >
      {/* Modals */}
      <AnimatePresence>
        {showReconnectModal && disconnectedRoomCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-8 rounded-2xl border-2 shadow-2xl max-w-md w-full text-center ${
                isDark ? "bg-zinc-900 border-amber-500" : "bg-white border-amber-400"
              }`}
            >
              <div className="text-6xl mb-4">📡</div>
              <h2 className="text-3xl font-bold text-amber-500 mb-4 font-serif">
                Connection Lost
              </h2>
              <p className={`mb-2 ${isDark ? "text-stone-300" : "text-gray-600"}`}>
                You were disconnected from the room.
              </p>
              <p className={`mb-6 text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                {Math.floor(reconnectCountdown / 60)}:
                {(reconnectCountdown % 60).toString().padStart(2, "0")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    play("uiTap");
                    onReconnectToRoom(disconnectedRoomCode);
                  }}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-500 transition-all"
                >
                  Reconnect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    play("uiTap");
                    setShowReconnectModal(false);
                    setDisconnectedRoomCode(null);
                    onExitAfterDisconnect();
                  }}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    isDark ? "bg-zinc-700 text-stone-300 hover:bg-zinc-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {pendingDisconnect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] lg:w-[40%]"
          >
            <div
              className={`p-4 rounded-2xl border-2 shadow-2xl flex items-center justify-between gap-4 ${
                isDark ? "bg-zinc-900 border-amber-500 text-stone-100" : "bg-white border-amber-400 text-gray-800"
              }`}
            >
              <div className="flex-1">
                <p className="font-bold">
                  {pendingDisconnect.username} disconnected
                  {pendingDisconnect.isHost ? " (Host)" : ""}.
                </p>
                <p className="text-sm opacity-70">
                  Waiting for reconnect:{" "}
                  {formatMs(Math.max(0, pendingDisconnect.expiresAt - nowTick))}
                </p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </motion.div>
        )}

        {/* Multi-disconnect banners */}
        {pendingDisconnects && pendingDisconnects.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] lg:w-[40%] space-y-3"
          >
            {pendingDisconnects.map((d: any) => (
              <div
                key={`${d.username}-${d.expiresAt}`}
                className={`p-4 rounded-2xl border-2 shadow-2xl flex items-center justify-between gap-4 ${
                  isDark ? "bg-zinc-900 border-amber-500 text-stone-100" : "bg-white border-amber-400 text-gray-800"
                }`}
              >
                <div className="flex-1">
                  <p className="font-bold">
                    {d.username} disconnected{d.isHost ? " (Host)" : ""}.
                  </p>
                  <p className="text-sm opacity-70">
                    Waiting for reconnect: {formatMs(Math.max(0, d.expiresAt - nowTick))}
                  </p>
                </div>
                <div className="text-2xl">⏳</div>
              </div>
            ))}
          </motion.div>
        )}

        {showRules && (
          <HowToPlayModal
            isDark={isDark}
            onClose={() => {
              play("uiTap");
              setShowRules(false);
            }}
          />
        )}
        <OpponentProfileModal
          isOpen={isOpponentModalOpen}
          isLoading={isOpponentLoading}
          error={opponentError}
          profile={opponentProfile}
          onClose={() => {
            play("uiTap");
            closeOpponentProfile();
          }}
          theme={theme}
        />

        {gameState.winner && (
          <GameOverModal
            players={gameState.players}
            winner={gameState.winner}
            localPlayerName={localPlayerName}
            rematchState={rematchState}
            onRequestRematch={() => {
              play("uiTap");
              actions.requestRematch();
            }}
            onBackToMenu={() => {
              play("uiTap");
              actions.leaveRoom(true, { clearStoredSession: true });
            }}
            isDark={isDark}
            reason={gameOverInfo?.reason}
            winnerStats={gameOverInfo?.winnerStats ?? null}
            loserStats={gameOverInfo?.loserStats ?? []}
          />
        )}

        {gameState.turnPhase === "ChooseNoble" && isLocalTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl max-w-2xl w-full text-center ${
                isDark ? "bg-zinc-900 border-amber-500" : "bg-white border-amber-400"
              }`}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-4 font-serif">
                A Noble Visits!
              </h2>
              <p
                className={`mb-8 text-base sm:text-lg font-sans ${
                  isDark ? "text-stone-300" : "text-gray-600"
                }`}
              >
                You are eligible for multiple nobles. Choose one to keep.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {gameState.pendingNobles.map((noble) => (
                  <div key={noble.id}>
                    <NobleTile
                      noble={noble}
                      isSelectable={true}
                      onClick={() => {
                        play("noble");
                        actions.sendAction({
                          type: "CHOOSE_NOBLE",
                          payload: { nobleId: noble.id },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDiscardModal && (isDiscardPhase || pendingDiscardAction) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeDiscardModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl max-w-2xl w-full text-center ${
                isDark ? "bg-zinc-900 border-amber-500" : "bg-white border-amber-400"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2 font-serif">
                  Discard Tokens
                </h2>
                <button
                  onClick={closeDiscardModal}
                  className="text-stone-400 hover:text-stone-200 transition-colors rounded-full p-1"
                  aria-label="Close discard modal"
                >
                  ✕
                </button>
              </div>

              <p
                className={`mb-8 text-base sm:text-lg font-sans ${
                  isDark ? "text-stone-300" : "text-gray-600"
                }`}
              >
                {pendingDiscardAction ? (
                  <>
                    You would have {simulatedTotalTokens} tokens after this action.
                    Please discard {requiredDiscardCount} to continue.
                  </>
                ) : (
                  <>
                    You have {simulatedTotalTokens} tokens. You must discard{" "}
                    {requiredDiscardCount} to continue.
                  </>
                )}
              </p>

              <div className="mb-10">
                <DiscardTokenPicker
                  holdings={
                    getAvailableOwnedTokens() as Record<GemColor, number>
                  }
                  discardSelection={discardSelection}
                  onToggle={toggleDiscardSelection}
                  isDark={isDark}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setDiscardSelection([])}
                  className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-colors font-sans ${
                    isDark ? "bg-zinc-800 text-stone-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Reset Selection
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  disabled={discardSelection.length !== requiredDiscardCount}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-amber-600 font-bold rounded-full hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg font-sans text-white"
                >
                  Confirm Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDiscardPhase && !showDiscardModal && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-amber-500 transition-colors font-semibold"
            onClick={() => setShowDiscardModal(true)}
          >
            Open discard modal
          </motion.button>
        )}
      </AnimatePresence>

      {/* Turn Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 pt-2">
          {gameState.winner ? (
            <div className="flex justify-end">
              <div className="text-sm sm:text-lg font-bold text-emerald-500 font-serif bg-black/25 px-4 sm:px-6 py-2 rounded-full border border-white/10 shadow-md">
                Winner: {gameState.winner.name}!
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <div
                className={`text-sm sm:text-base px-4 sm:px-6 py-2 rounded-full border shadow-md font-serif transition-colors
                  ${
                    isDark
                      ? "text-stone-200 bg-zinc-900/60 border-zinc-700/50"
                      : "text-gray-800 bg-white/65 border-gray-200/70"
                  }
                `}
              >
                Turn:{" "}
                <span className="font-bold text-amber-500">
                  {currentPlayer.name} {isLocalTurn ? "(You)" : ""}
                </span>
                {gameState.isLastRound && (
                  <span className="ml-2 sm:ml-3 text-red-500 font-bold animate-pulse font-sans text-[10px] sm:text-xs uppercase tracking-wider">
                    Last Round!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex flex-row justify-between items-center mb-4 lg:mb-6 gap-2 sm:gap-3 shrink-0 min-w-0">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-lg font-serif whitespace-nowrap">
            Splendor
          </h1>
          <span className="text-xs text-stone-400 font-mono">Room: {roomCode}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6 flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => {
              play("uiTap");
              setShowRules(true);
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold transition-all shadow-md flex items-center gap-2 text-sm sm:text-base ${
              isDark ? "bg-zinc-800 text-stone-300 hover:bg-zinc-700" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="text-amber-500">?</span> Rules
          </button>
          <button
            type="button"
            title={muted ? "Unmute sound effects" : "Mute sound effects"}
            onClick={toggleMuted}
            className={`p-1.5 sm:p-3 rounded-full transition-all shadow-md ${
              isDark ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700" : "bg-white text-amber-600 hover:bg-gray-50 border border-gray-200"
            } ${muted ? "opacity-60" : ""}`}
          >
            {muted ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />}
          </button>
          <div className="relative" ref={musicPickerRef}>
            <button
              type="button"
              title="Background music"
              onClick={() => { play("uiTap"); setShowMusicPicker((p) => !p); }}
              className={`p-1.5 sm:p-3 rounded-full transition-all shadow-md ${
                isDark ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700" : "bg-white text-amber-600 hover:bg-gray-50 border border-gray-200"
              } ${musicTrack === 'none' || muted ? "opacity-60" : ""}`}
            >
              <Music className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </button>
            {showMusicPicker && (
              <div
                className={`absolute right-0 top-full mt-2 z-50 rounded-xl shadow-2xl overflow-hidden min-w-[130px] border ${
                  isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
                }`}
              >
                {musicTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      play("uiTap");
                      setMusicTrack(track.id);
                      setShowMusicPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      musicTrack === track.id
                        ? isDark
                          ? "bg-amber-600/30 text-amber-400"
                          : "bg-amber-50 text-amber-700"
                        : isDark
                          ? "text-zinc-300 hover:bg-zinc-800"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {musicTrack === track.id ? "✓ " : "\u00A0\u00A0"}{track.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              play("uiTap");
              onThemeToggle();
            }}
            className={`p-1.5 sm:p-3 rounded-full transition-all shadow-md ${
              isDark ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700" : "bg-white text-amber-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <RoomChatPanel
        roomCode={roomCode}
        theme={theme}
        localPlayerName={localPlayerName}
        localUserId={localUserId}
        layout="sidebar"
        onChatBackgroundNotify={onChatBackgroundNotify}
      />

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-2 lg:gap-4 flex-1 min-h-0 items-stretch">
        <div className="order-2 lg:order-none lg:w-1/3 flex flex-col gap-1 w-full">
          <div
            className={`lg:hidden flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70 animate-pulse ${
              isDark ? "text-zinc-400" : "text-gray-500"
            }`}
          >
            <span>⟵</span>
            <span>Swipe to see players</span>
            <span>⟶</span>
          </div>

          <div className="flex flex-col lg:flex-row w-full gap-1 lg:gap-2 h-full">
            <div
              className={`hidden lg:flex flex-col items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider opacity-70 animate-pulse select-none px-1 ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}
            >
              <span>↑</span>
              <span className="[writing-mode:vertical-rl] rotate-180">
                Scroll to see players
              </span>
              <span>↓</span>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex-1 flex flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto py-4 px-1 lg:py-5 lg:px-1 snap-x snap-mandatory hide-scrollbar"
            >
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  ref={(el) => {
                    playerRefs.current[idx] = el;
                  }}
                  className="w-full shrink-0 snap-center transition-transform duration-300"
                >
                  <PlayerDashboard
                    player={player}
                    isActive={gameState.currentPlayerIndex === idx}
                    isCurrentPlayer={player.name === localPlayerName}
                    turnPhase={gameState.turnPhase}
                    onAvatarClick={(playerId) => openOpponentProfile(playerId)}
                    onBuyReserved={(cardId) => {
                      play("purchase");
                      actions.sendAction({
                        type: "PURCHASE_CARD",
                        payload: { cardId },
                      });
                    }}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 order-1 lg:order-none">
          <CenterBoard
            gameState={gameState}
            currentPlayer={currentPlayer}
            selectedTokens={selectedTokens}
            onTokenClick={toggleTokenSelection}
            onTakeTokens={handleTakeTokens}
            onClearTokens={() => {
              play("uiTap");
              setSelectedTokens([]);
            }}
            onBuyCard={(id) => {
              play("purchase");
              actions.sendAction({ type: "PURCHASE_CARD", payload: { cardId: id } });
            }}
            onReserveCard={handleReserveCard}
            onReserveFromDeck={handleReserveFromDeck}
            isDark={isDark}
            tokenInteractionDisabled={Boolean(
              tokenFlightVisual || cardFlightVisual || boardAnimating,
            )}
          />
        </div>
      </div>
    </div>
    </div>
  );
}

