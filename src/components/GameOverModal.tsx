import { motion } from 'framer-motion';
import { Player, GemColor } from '../game/models';
import { gemStylesBank } from '../constants';

interface RematchState {
  enabled: boolean;
  requestedBy: string[];
  totalPlayers: number;
  message?: string;
}

export type GameOverWinnerStats = {
  coins: number;
  winRate: number;
  xp?: number;
  wins?: number;
  losses?: number;
};

export type GameOverLoserStat = {
  userId: string;
  coinsLost: number;
  coins: number;
  xp: number;
  wins: number;
  losses: number;
  winRate: number;
};

interface GameOverModalProps {
  players: Player[];
  winner: Player;
  localPlayerName: string;
  rematchState: RematchState | null;
  onRequestRematch: () => void;
  onBackToMenu: () => void;
  isDark: boolean;
  reason?: string;
  winnerStats?: GameOverWinnerStats | null;
  loserStats?: GameOverLoserStat[];
}

function intPercent(n: number | undefined | null): number {
  if (n === undefined || n === null || Number.isNaN(n)) return 0;
  return Math.round(Number(n));
}

export const GameOverModal = ({
  players,
  winner,
  localPlayerName,
  rematchState,
  onRequestRematch,
  isDark,
  onBackToMenu,
  reason,
  winnerStats,
  loserStats = [],
}: GameOverModalProps) => {
  const losers = players
    .filter((p) => p.id !== winner.id)
    .sort((a, b) => b.currentScore - a.currentScore);

  const rematchEnabled = rematchState?.enabled ?? true;
  const requestedBy = rematchState?.requestedBy ?? [];
  const totalPlayers = rematchState?.totalPlayers ?? players.length;
  const hasRequestedRematch = requestedBy.includes(localPlayerName);

  const statByUserId = (userId: string) =>
    loserStats.find((s) => s.userId === userId);

  const WinnerCard = ({ player }: { player: Player }) => {
    const totalTokens = Object.values(player.ownedTokens).reduce((a, b) => a + b, 0);
    const totalCards = Object.values(player.currentBonuses).reduce((a, b) => a + b, 0);

    return (
      <div
        className={`flex min-w-0 flex-col gap-2 rounded-lg border-2 p-2.5 sm:gap-2.5 sm:rounded-xl sm:p-3 md:p-4 ${
          isDark
            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            : 'border-amber-500 bg-amber-500/10'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 sm:text-xs">
              🏆 Winner
            </span>
            <span
              className={`truncate font-serif text-base font-bold sm:text-lg md:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}
            >
              {player.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5">
            <span className="font-sans text-lg font-black text-amber-500 sm:text-xl md:text-2xl">{player.currentScore}</span>
            <span className="text-amber-500 sm:text-lg">★</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {[
            ['Cards', totalCards],
            ['Nobles', player.ownedNobles.length],
            ['Tokens', totalTokens],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              className={`rounded-md p-1 text-center sm:rounded-lg sm:p-1.5 ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}
            >
              <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{label}</div>
              <div className={`font-black sm:text-lg ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>{val}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
          {(Object.keys(player.ownedTokens) as GemColor[]).map((color) => {
            const amount = player.ownedTokens[color];
            if (amount === 0) return null;
            return (
              <div
                key={color}
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold sm:h-6 sm:w-6 sm:text-[9px] ${gemStylesBank[color].chip}`}
              >
                {amount}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const LoserCard = ({
    player,
    place,
    stats,
  }: {
    player: Player;
    place: number;
    stats?: GameOverLoserStat;
  }) => {
    const totalTokens = Object.values(player.ownedTokens).reduce((a, b) => a + b, 0);
    const totalCardsBonus = Object.values(player.currentBonuses).reduce((a, b) => a + b, 0);
    const purchasedCount = player.purchasedCards?.length ?? 0;

    const redBorder = isDark ? 'border-rose-600/80' : 'border-rose-500';
    const redBg = isDark ? 'bg-rose-950/40' : 'bg-rose-50';
    const redLabel = isDark ? 'text-rose-400' : 'text-rose-700';
    const redGlow = isDark ? 'shadow-[0_0_18px_rgba(244,63,94,0.15)]' : '';

    return (
      <div
        className={`flex min-w-0 flex-col gap-2 rounded-lg border-2 p-2.5 sm:gap-2.5 sm:rounded-xl sm:p-3 md:p-4 ${redBorder} ${redBg} ${redGlow}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${redLabel}`}>
              💔 Defeat · #{place}
            </span>
            <span
              className={`truncate font-serif text-base font-bold sm:text-lg md:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}
            >
              {player.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5">
            <span className="font-sans text-lg font-black text-rose-500 sm:text-xl md:text-2xl">{player.currentScore}</span>
            <span className="text-rose-500 sm:text-lg">★</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {[
            ['Cards', totalCardsBonus],
            ['Nobles', player.ownedNobles.length],
            ['Tokens', totalTokens],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              className={`rounded-md p-1 text-center sm:rounded-lg sm:p-1.5 ${isDark ? 'bg-zinc-900/50' : 'bg-white/80'}`}
            >
              <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{label}</div>
              <div className={`font-black sm:text-lg ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>{val}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
          {(Object.keys(player.ownedTokens) as GemColor[]).map((color) => {
            const amount = player.ownedTokens[color];
            if (amount === 0) return null;
            return (
              <div
                key={color}
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold sm:h-6 sm:w-6 sm:text-[9px] ${gemStylesBank[color].chip}`}
              >
                {amount}
              </div>
            );
          })}
        </div>

        {stats && (
          <div
            className={`rounded-lg border-2 p-2.5 sm:rounded-xl sm:p-3 ${
              isDark ? 'border-rose-500/35 bg-zinc-900/50' : 'border-rose-200 bg-white'
            }`}
          >
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-rose-500/90">
              Account stats
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Coins lost'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                  {stats.coinsLost}
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Balance'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {stats.coins}
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Win rate'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {intPercent(stats.winRate)}%
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Wins'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>
                  {stats.wins}
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Losses'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>
                  {stats.losses}
                </div>
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'XP'}</div>
                <div className={`text-base font-black tabular-nums sm:text-lg ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>
                  {stats.xp}
                </div>
              </div>
            </div>
            <div className={`mt-2 border-t pt-2 text-center text-[10px] sm:text-xs ${isDark ? 'border-rose-500/20 text-stone-400' : 'border-rose-100 text-gray-600'}`}>
              {purchasedCount} development card{purchasedCount === 1 ? '' : 's'} purchased this match
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:min-h-0 sm:p-3 md:p-4">
        <div
          className={`mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-t-2xl border-2 border-b-0 sm:my-auto sm:max-h-[min(92dvh,92svh)] sm:rounded-2xl sm:border-b-2 md:rounded-3xl ${
            isDark ? 'border-amber-600/50 bg-zinc-900' : 'border-amber-300 bg-white'
          }`}
        >
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-6 md:px-8 ${
              isDark ? 'bg-zinc-900' : 'bg-white'
            }`}
          >
            <div className="mx-auto flex max-w-xl flex-col gap-5 lg:max-w-none lg:flex-row lg:items-start lg:gap-4 lg:gap-6">
              {/* Victory column */}
              <div className="flex min-w-0 flex-1 flex-col items-center text-center lg:max-w-md">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mb-2 text-4xl sm:mb-3 sm:text-5xl md:text-6xl"
                >
                  👑
                </motion.div>
                <h2 className="mb-0.5 font-serif text-2xl font-black uppercase tracking-tighter text-amber-500 sm:mb-1 sm:text-3xl md:text-4xl">
                  Victory!
                </h2>
                <p
                  className={`mb-3 max-w-md px-1 font-sans text-xs leading-snug sm:mb-4 sm:text-sm md:text-base ${isDark ? 'text-stone-400' : 'text-gray-600'}`}
                >
                  {reason || 'The merchant guild has a new leader.'}
                </p>

                <div className="w-full">
                  <WinnerCard player={winner} />
                </div>

                {winnerStats && (
                  <div
                    className={`mt-3 w-full rounded-xl border-2 p-2.5 sm:mt-4 sm:p-3 md:p-4 ${
                      isDark ? 'border-amber-500/40 bg-zinc-900/40' : 'border-amber-500/20 bg-white'
                    }`}
                  >
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-500/90">
                      Account stats
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="text-left">
                        <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Coins'}</div>
                        <div className={`text-lg font-black tabular-nums sm:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {winnerStats.coins}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Win rate'}</div>
                        <div className={`text-lg font-black tabular-nums sm:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {intPercent(winnerStats.winRate)}%
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'XP'}</div>
                        <div className={`text-lg font-black tabular-nums sm:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {winnerStats.xp ?? '—'}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Wins'}</div>
                        <div className={`text-lg font-black tabular-nums sm:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {winnerStats.wins ?? '—'}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>{'Losses'}</div>
                        <div className={`text-lg font-black tabular-nums sm:text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {winnerStats.losses ?? '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Defeat column */}
              <div className="flex min-w-0 flex-1 flex-col lg:max-w-md">
                <h3
                  className={`mb-3 text-left font-serif text-lg font-bold sm:mb-4 sm:text-xl md:text-2xl ${isDark ? 'text-stone-200' : 'text-gray-800'}`}
                >
                  Defeat
                </h3>
                <div className="flex flex-col gap-4">
                  {losers.map((player, i) => (
                    <LoserCard
                      key={player.id}
                      player={player}
                      place={i + 2}
                      stats={statByUserId(player.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions — pinned bottom of screen */}
          <div
            className={`shrink-0 border-t-2 px-3 py-3 sm:px-5 sm:py-4 ${
              isDark
                ? 'border-amber-600/30 bg-zinc-950/95'
                : 'border-amber-200 bg-white'
            }`}
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {rematchState?.message && (
              <p className={`mb-2 text-center text-xs sm:text-left sm:text-sm ${isDark ? 'text-stone-300' : 'text-gray-600'}`}>
                {rematchState.message}
              </p>
            )}
            <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={onRequestRematch}
                disabled={!rematchEnabled || hasRequestedRematch}
                className={`min-h-[48px] flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wide transition-all active:scale-[0.98] sm:min-h-[44px] sm:rounded-2xl sm:text-base ${
                  rematchEnabled
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-500'
                    : 'cursor-not-allowed bg-gray-400 text-gray-100'
                } ${hasRequestedRematch ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                {!rematchEnabled ? 'Rematch disabled' : hasRequestedRematch ? 'Waiting…' : 'Rematch'}
              </button>

              <button
                type="button"
                onClick={onBackToMenu}
                className={`min-h-[48px] flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wide transition-all active:scale-[0.98] sm:rounded-2xl sm:text-base ${
                  isDark ? 'bg-zinc-700 text-stone-300 shadow-lg hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 shadow-lg hover:bg-gray-300'
                }`}
              >
                Menu
              </button>
            </div>
            {rematchEnabled && requestedBy.length > 0 && (
              <p className={`mt-2 text-center text-xs sm:text-left sm:text-sm ${isDark ? 'text-stone-300' : 'text-gray-600'}`}>
                Rematch ready: {requestedBy.length}/{totalPlayers}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
