import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeGame } from './game/setup';
import { GemColor, GameState } from './game/models';
import { takeTokens, purchaseCard, reserveCard, reserveCardFromDeck, discardTokens, chooseNoble, getTotalTokens, GameError } from './game/actions';
import { noblesData, level1Cards, level2Cards, level3Cards } from './game/data';
import { gemStyles } from './constants';

// Components
import { GameSetup } from './components/GameSetup';
import { PlayerDashboard } from './components/PlayerDashboard';
import { CenterBoard } from './components/CenterBoard';
import { NobleTile } from './components/NobleTile';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<GemColor[]>([]);
  const [discardSelection, setDiscardSelection] = useState<GemColor[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showRules, setShowRules] = useState(false);

  // Refs for auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to current player when turn changes
  useEffect(() => {
    if (gameState && scrollContainerRef.current) {
      const activePlayerElement = playerRefs.current[gameState.currentPlayerIndex];
      if (activePlayerElement) {
        activePlayerElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [gameState?.currentPlayerIndex]);

  const handleStartGame = (names: string[]) => {
    setGameState(initializeGame(names, level1Cards, level2Cards, level3Cards, noblesData));
  };

  const handleRestart = () => {
    setGameState(null);
    setSelectedTokens([]);
    setDiscardSelection([]);
  };

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleAction = (actionFn: () => void) => {
    try {
      actionFn();
      setSelectedTokens([]);
      setDiscardSelection([]);
    } catch (e) {
      if (e instanceof GameError) showToast(e.message);
    }
  };

  const toggleTokenSelection = (color: GemColor) => {
    if (color === GemColor.Gold) return;
    const count = selectedTokens.filter(c => c === color).length;
    if (count >= 2) return;
    setSelectedTokens([...selectedTokens, color]);
  };

  const toggleDiscardSelection = (color: GemColor) => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const currentCount = discardSelection.filter(c => c === color).length;
    if (currentCount < currentPlayer.ownedTokens[color]) {
      setDiscardSelection([...discardSelection, color]);
    }
  };

  if (!gameState) {
    return (
      <GameSetup 
        onStart={handleStartGame} 
        theme={theme} 
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
      />
    );
  }

  const isDark = theme === 'dark';
  const players = gameState.players;
  const currentPlayer = players[gameState.currentPlayerIndex];

  return (
    <div
      className={`min-h-screen w-full overflow-y-auto transition-colors duration-500 p-2 sm:p-4 lg:p-8 pt-14 sm:pt-16 font-sans flex flex-col bg-cover bg-center bg-fixed ${isDark ? "text-stone-100" : "text-gray-800"}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.16)"}, ${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.16)"}), url('/images/game-bg.jpg')`,
      }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              fixed top-4 left-1/2 -translate-x-1/2 z-[999] items-center
              w-[90%] lg:w-[50%] px-4 py-2.5 justify-center rounded-lg shadow-2xl font-bold font-sans flex gap-2  border-2 
              ${toast.type === "error" ? "bg-red-600 border-red-400 text-white" : "bg-emerald-600 border-emerald-400 text-white"}
              `}
          >
            <span className="text-lg sm:text-xl flex-shrink-0 drop-shadow-md">
              {toast.type === "error" ? "⚠️" : "✅"}
            </span>
            <span className="text-sm sm:text-base leading-snug w-full lg:text-center sm:text-center ">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showRules && (
          <HowToPlayModal isDark={isDark} onClose={() => setShowRules(false)} />
        )}

        {gameState.winner && (
          <GameOverModal
            players={gameState.players}
            winner={gameState.winner}
            onRestart={handleRestart}
            isDark={isDark}
          />
        )}

        {gameState.turnPhase === "ChooseNoble" && (
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
              className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl max-w-2xl w-full text-center ${isDark ? "bg-zinc-900 border-amber-500" : "bg-white border-amber-400"}`}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-4 font-serif">
                A Noble Visits!
              </h2>
              <p
                className={`mb-8 text-base sm:text-lg font-sans ${isDark ? "text-stone-300" : "text-gray-600"}`}
              >
                You are eligible for multiple nobles. Choose one to keep.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {gameState.pendingNobles.map((noble) => (
                  <div key={noble.id}>
                    <NobleTile
                      noble={noble}
                      isSelectable={true}
                      onClick={() =>
                        handleAction(() =>
                          setGameState(chooseNoble(gameState, noble.id)),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState.turnPhase === "DiscardTokens" && (
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
              className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl max-w-2xl w-full text-center ${isDark ? "bg-zinc-900 border-amber-500" : "bg-white border-amber-400"}`}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2 font-serif">
                Discard Tokens
              </h2>
              <p
                className={`mb-8 text-base sm:text-lg font-sans ${isDark ? "text-stone-300" : "text-gray-600"}`}
              >
                You have {getTotalTokens(currentPlayer)} tokens. You must
                discard {getTotalTokens(currentPlayer) - 10} to continue.
              </p>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
                {(Object.keys(currentPlayer.ownedTokens) as GemColor[]).map(
                  (color) => {
                    const amount = currentPlayer.ownedTokens[color];
                    if (amount === 0) return null;
                    const discardedCount = discardSelection.filter(
                      (c) => c === color,
                    ).length;
                    const style = gemStyles[color];
                    return (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleDiscardSelection(color)}
                        disabled={discardedCount >= amount}
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg transition-all relative font-sans drop-shadow-md
                        ${style.chip} ${discardedCount >= amount ? "opacity-30 cursor-not-allowed" : "hover:shadow-xl cursor-pointer"}
                      `}
                      >
                        {amount - discardedCount}
                        {discardedCount > 0 && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full text-[10px] sm:text-xs flex items-center justify-center text-white border-2 border-zinc-900 shadow-md">
                            -{discardedCount}
                          </span>
                        )}
                      </motion.button>
                    );
                  },
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setDiscardSelection([])}
                  className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-colors font-sans ${isDark ? "bg-zinc-800 text-stone-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  Reset Selection
                </button>
                <button
                  onClick={() =>
                    handleAction(() =>
                      setGameState(discardTokens(gameState, discardSelection)),
                    )
                  }
                  disabled={
                    discardSelection.length !==
                    getTotalTokens(currentPlayer) - 10
                  }
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-amber-600 font-bold rounded-full hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg font-sans text-white"
                >
                  Confirm Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turn Indicator (always visible) */}
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
                  ${isDark ? "text-stone-200 bg-zinc-900/60 border-zinc-700/50" : "text-gray-800 bg-white/65 border-gray-200/70"}
                `}
              >
                Turn:{" "}
                <span className="font-bold text-amber-500">
                  {currentPlayer.name}
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
        <h1 className="text-2xl sm:text-4xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-lg font-serif whitespace-nowrap">
          Splendor
        </h1>
        <div className="flex items-center gap-2 sm:gap-6 flex-nowrap shrink-0">
          <button
            onClick={() => setShowRules(true)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold transition-all shadow-md flex items-center gap-2 text-sm sm:text-base ${isDark ? "bg-zinc-800 text-stone-300 hover:bg-zinc-700" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
          >
            <span className="text-amber-500">?</span> Rules
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-1.5 sm:p-3 rounded-full transition-all shadow-md ${isDark ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700" : "bg-white text-amber-600 hover:bg-gray-50 border border-gray-200"}`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Main Layout Container - Reduced gap for mobile (gap-2) */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-2 lg:gap-4 flex-1 min-h-0 items-stretch">
        {/* Players Sidebar Wrapper (Left) */}
        <div className="order-2 lg:order-none lg:w-1/3 flex flex-col gap-1 w-full">
          
          {/* Mobile Horizontal Indicator */}
          <div
            className={`lg:hidden flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70 animate-pulse ${isDark ? "text-zinc-400" : "text-gray-500"}`}
          >
            <span>⟵</span>
            <span>Swipe to see players</span>
            <span>⟶</span>
          </div>

          {/* Wrapper for Desktop Indicator and Scroll Container */}
          <div className="flex flex-col lg:flex-row w-full gap-1 lg:gap-2 h-full">
            
            {/* Desktop Vertical Indicator (Left Side) */}
            <div
              className={`hidden lg:flex flex-col items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider opacity-70 animate-pulse select-none px-1 ${isDark ? "text-zinc-400" : "text-gray-500"}`}
            >
              <span>↑</span>
              <span className="[writing-mode:vertical-rl] rotate-180">
                Scroll to see players
              </span>
              <span>↓</span>
            </div>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto max-h-none lg:max-h-screen py-4 px-1 lg:py-5 lg:px-1 snap-x snap-mandatory hide-scrollbar"
            >
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  ref={(el) => {playerRefs.current[idx] = el;}}
                  className="w-full shrink-0 snap-center transition-transform duration-300"
                >
                  <PlayerDashboard
                    player={player}
                    isActive={gameState.currentPlayerIndex === idx}
                    isCurrentPlayer={gameState.currentPlayerIndex === idx}
                    turnPhase={gameState.turnPhase}
                    onBuyReserved={(cardId) => handleAction(() => setGameState(purchaseCard(gameState, cardId)))}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
            
          </div>
        </div>


        {/* Main Board (Right) */}
        <div className="w-full lg:flex-1 order-1 lg:order-none">
          <CenterBoard
            gameState={gameState}
            currentPlayer={currentPlayer}
            selectedTokens={selectedTokens}
            onTokenClick={toggleTokenSelection}
            onTakeTokens={() =>handleAction(() => setGameState(takeTokens(gameState, selectedTokens)))}
            onClearTokens={() => setSelectedTokens([])}
            onBuyCard={(id) =>handleAction(() => setGameState(purchaseCard(gameState, id)))}
            onReserveCard={(id) =>handleAction(() => setGameState(reserveCard(gameState, id)))}
            onReserveFromDeck={(level) =>handleAction(() => setGameState(reserveCardFromDeck(gameState, level)),)}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}
