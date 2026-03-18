import { motion, AnimatePresence } from 'framer-motion';
import { Player, GemColor } from '../game/models';
import { gemStyles } from '../constants';

interface GameOverModalProps {
  players: Player[];
  winner: Player;
  onRestart: () => void;
  isDark: boolean;
}

export const GameOverModal = ({ players, winner, onRestart, isDark }: GameOverModalProps) => {
  const losers = players.filter(p => p.id !== winner.id).sort((a, b) => b.currentScore - a.currentScore);

  const PlayerStats = ({ player, isWinner = false }: { player: Player, isWinner?: boolean, key?: any }) => {
    const totalTokens = Object.values(player.ownedTokens).reduce((a, b) => a + b, 0);
    const totalCards = Object.values(player.currentBonuses).reduce((a, b) => a + b, 0);

    return (
      <div className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-all ${isWinner ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className={`text-xs uppercase tracking-widest font-bold ${isWinner ? 'text-amber-500' : isDark ? 'text-stone-500' : 'text-gray-500'}`}>
              {isWinner ? '🏆 Winner' : 'Player'}
            </span>
            <span className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-zinc-900'}`}>{player.name}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
            <span className="text-2xl font-black text-amber-500 font-sans">{player.currentScore}</span>
            <span className="text-amber-500 text-lg">★</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
            <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Cards</div>
            <div className={`text-lg font-black ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>{totalCards}</div>
          </div>
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
            <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Nobles</div>
            <div className={`text-lg font-black ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>{player.ownedNobles.length}</div>
          </div>
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
            <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Tokens</div>
            <div className={`text-lg font-black ${isDark ? 'text-stone-200' : 'text-zinc-800'}`}>{totalTokens}</div>
          </div>
        </div>

        <div className="flex gap-1 justify-center">
          {(Object.keys(player.ownedTokens) as GemColor[]).map(color => {
            const amount = player.ownedTokens[color];
            if (amount === 0) return null;
            return (
              <div key={color} className={`w-5 h-5 rounded-full ${gemStyles[color].chip} border flex items-center justify-center text-[8px] font-bold`}>
                {amount}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`max-w-4xl w-full rounded-3xl border-2 shadow-2xl overflow-hidden flex flex-col lg:flex-row ${isDark ? 'bg-zinc-900 border-amber-600/50' : 'bg-white border-amber-500/30'}`}
      >
        {/* Winner Section */}
        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-500/20 to-transparent border-b lg:border-b-0 lg:border-r border-amber-500/20">
          <motion.div 
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-8xl mb-6"
          >
            👑
          </motion.div>
          <h2 className="text-5xl font-black text-amber-500 mb-2 font-serif uppercase tracking-tighter">Victory!</h2>
          <p className={`text-lg mb-8 font-sans ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>The merchant guild has a new leader.</p>
          
          <div className="w-full max-w-sm">
            <PlayerStats player={winner} isWinner={true} />
          </div>
        </div>

        {/* Losers Section */}
        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col">
          <h3 className={`text-2xl font-bold font-serif mb-6 ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>Final Standings</h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {losers.map(player => (
              <PlayerStats key={player.id} player={player} />
            ))}
          </div>

          <button 
            onClick={onRestart}
            className="mt-8 w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-amber-500 shadow-lg transition-all active:scale-95 shadow-amber-900/20"
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </div>
  );
};
