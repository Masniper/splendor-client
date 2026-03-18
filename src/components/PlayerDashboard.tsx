import { Player, GemColor, TurnPhase } from '../game/models';
import { gemStylesBank, gemIconSrc } from '../constants';
import { getTotalTokens, canAffordCard } from '../game/actions';
import { DevelopmentCard } from './DevelopmentCard';
import { NobleTile } from './NobleTile';

interface PlayerDashboardProps {
  player: Player;
  isActive: boolean;
  isCurrentPlayer: boolean;
  turnPhase: TurnPhase;
  onBuyReserved: (id: string) => void;
  theme: 'light' | 'dark';
  key?: any;
}

export const PlayerDashboard = ({ player, isActive, isCurrentPlayer, turnPhase, onBuyReserved, theme }: PlayerDashboardProps) => {
  const isDark = theme === 'dark';

  const bonusColors = [GemColor.Diamond, GemColor.Sapphire, GemColor.Emerald, GemColor.Ruby, GemColor.Onyx];
  const tokenColors = [GemColor.Diamond, GemColor.Sapphire, GemColor.Emerald, GemColor.Ruby, GemColor.Onyx, GemColor.Gold];

  const bonusCardStyles: Record<GemColor, { bg: string; border: string; glow: string }> = {
    [GemColor.Diamond]: { bg: 'bg-gradient-to-br from-slate-50/80 to-slate-200/50', border: 'border-slate-300/70', glow: 'shadow-[0_0_12px_rgba(226,232,240,0.55)]' },
    [GemColor.Sapphire]: { bg: 'bg-gradient-to-br from-blue-500/25 to-blue-900/25', border: 'border-blue-500/40', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' },
    [GemColor.Emerald]: { bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/25', border: 'border-emerald-500/40', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
    [GemColor.Ruby]: { bg: 'bg-gradient-to-br from-red-500/20 to-red-900/25', border: 'border-red-500/40', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]' },
    [GemColor.Onyx]: { bg: 'bg-gradient-to-br from-zinc-700/30 to-zinc-950/30', border: 'border-zinc-500/35', glow: 'shadow-[0_0_12px_rgba(24,24,27,0.55)]' },
    [GemColor.Gold]: { bg: 'bg-gradient-to-br from-yellow-300/25 to-yellow-700/25', border: 'border-yellow-400/45', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.35)]' },
  };

  return (
    <div
      className={`rounded-2xl border-2 p-4 flex flex-col shadow-inner transition-all relative
        ${isDark ? 'bg-zinc-800/50' : 'bg-white/70'}
        ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : isDark ? 'border-zinc-700/50' : 'border-gray-200/70'}
      `}
    >
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-zinc-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-20 whitespace-nowrap border-2 border-zinc-900">
          Current Turn
        </div>
      )}
      {/* 1. Header: Name & Total Prestige Points */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <h3 className={`text-xl font-bold font-serif leading-tight ${isActive ? 'text-amber-500' : isDark ? 'text-stone-200' : 'text-gray-800'}`}>
            {player.name}
          </h3>
          <div className={`text-[10px] uppercase tracking-wider font-sans ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            {player.ownedNobles.length} Nobles
          </div>
        </div>
        <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
          <span className="text-2xl font-black text-amber-500 font-sans drop-shadow-sm">{player.currentScore}</span>
          <span className="text-amber-500 text-lg">★</span>
        </div>
      </div>

      {/* 2. Tokens Section */}
      <div className="mb-4">
        <div className={`text-[10px] uppercase tracking-widest mb-2 font-bold font-sans ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
          Tokens ({getTotalTokens(player)}/10)
        </div>
        <div className="grid grid-cols-6 gap-1">
          {tokenColors.map((color) => {
            const amount = player.ownedTokens[color];
            const style = gemStylesBank[color];
            const isEmpty = amount === 0;
            return (
              <div 
                key={color} 
                className={`flex flex-col items-center gap-1 transition-all ${isEmpty ? 'opacity-30 saturate-75 brightness-90' : 'opacity-100'}`}
              >
                <div className={`w-8 h-8 rounded-full ${style.chip} border-2 flex items-center justify-center text-xs font-bold shadow-sm font-sans relative`}>
                  <img
                    src={gemIconSrc[color]}
                    alt={color}
                    className="pointer-events-none w-6 h-6 object-contain opacity-95"
                  />
                 <span className="absolute top-4 text-lg  font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                   {amount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bonuses Section (The Engine) */}
      <div className="mb-4">
        <div className={`text-[10px] uppercase tracking-widest mb-2 font-bold font-sans ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
          Bonuses (Engine)
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {bonusColors.map((color) => {
            const amount = player.currentBonuses[color] || 0;
            const isEmpty = amount === 0;
            const cStyle = bonusCardStyles[color];
            
            return (
              <div key={color} className="flex flex-col items-center">
                <div
                  className={`w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative transition-all
                    ${cStyle.bg} ${cStyle.border}
                    ${isEmpty ? 'opacity-30 saturate-75 brightness-90' : `opacity-100 ${cStyle.glow}`}
                  `}
                >
                  <img
                    src={gemIconSrc[color]}
                    alt={color}
                    className="pointer-events-none w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.65)]"
                  />
                  <span className={`mt-1 text-lg font-black font-sans ${isDark ? 'text-white' : 'text-zinc-900'} drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]`}>
                    {amount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Acquired Nobles Section (Overlapping) */}
      {player.ownedNobles.length > 0 && (
        <div className="mb-4">
          <div className={`text-[10px] uppercase tracking-widest mb-2 font-bold font-sans ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            Acquired Nobles
          </div>
          <div className="flex flex-row items-center">
            {player.ownedNobles.map((noble, index) => (
              <div 
                key={noble.id} 
                className={`transition-transform hover:scale-110 hover:z-30 ${index > 0 ? '-ml-10 sm:-ml-12' : ''}`}
                style={{ zIndex: index + 10 }}
              >
                <NobleTile noble={noble} isSelectable={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Reserved Cards Section */}
      {player.reservedCards.length > 0 && (
        <div className={`mt-auto pt-3 border-t ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div className={`text-[10px] uppercase tracking-wider mb-2 font-semibold font-sans ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            Reserved ({player.reservedCards.length}/3)
          </div>
          <div className="grid grid-cols-3 gap-3 justify-items-center items-center">
            {player.reservedCards.map(card => (
              <div key={card.id} className="w-full flex justify-center">
                <DevelopmentCard 
                  card={card}
                  affordable={canAffordCard(player, card)}
                  turnPhase={turnPhase}
                  onBuy={isCurrentPlayer ? () => onBuyReserved(card.id) : undefined}
                  isReserved={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
