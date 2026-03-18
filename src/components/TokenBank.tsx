import { motion } from 'framer-motion';
import { GemColor, TurnPhase } from '../game/models';
import { gemStyles, gemIconSrc } from '../constants';

interface TokenBankProps {
  bank: Record<GemColor, number>;
  selectedTokens: GemColor[];
  onTokenClick: (color: GemColor) => void;
  onTakeTokens: () => void;
  onClear: () => void;
  turnPhase: TurnPhase;
  isDark: boolean;
}

export const TokenBank = ({ bank, selectedTokens, onTokenClick, onTakeTokens, onClear, turnPhase, isDark }: TokenBankProps) => {
  
  const renderActionButtons = (isMobileLayout: boolean) => (
    <div className={`flex items-center gap-2 transition-all duration-150 ${isMobileLayout ? 'flex-row lg:hidden' : 'hidden lg:flex flex-col w-full'} ${selectedTokens.length > 0 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
      <button
        onClick={onClear}
        className={`text-[9px] sm:text-[10px] px-3 py-1.5 lg:px-2 lg:py-1 rounded-full transition-colors font-sans whitespace-nowrap ${isDark ? 'bg-zinc-700 text-stone-300 hover:bg-zinc-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${isMobileLayout ? '' : 'w-full'}`}
      >
        Clear
      </button>
      <button
        onClick={onTakeTokens}
        className={`text-[9px] sm:text-[10px] px-3 py-1.5 lg:px-3 lg:py-1 bg-emerald-600 font-bold rounded-full hover:bg-emerald-500 shadow-md transition-all active:scale-95 text-white font-sans whitespace-nowrap ${isMobileLayout ? '' : 'w-full'}`}
      >
        Take Tokens
      </button>
    </div>
  );

  return (
    <div className={`p-3 rounded-2xl border shadow-xl transition-colors flex flex-col h-full w-full ${isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-white border-gray-200'}`}>
      
      <div className="flex items-center justify-between mb-1 min-h-[32px]">
        <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
          Bank
        </h3>
        {renderActionButtons(true)}
      </div>
      
      <div className="flex flex-row lg:flex-col items-center gap-2 sm:gap-3 my-2 lg:my-10 flex-1 justify-between px-5 sm:px-20 lg:px-0 flex-wrap lg:flex-nowrap">
        {(Object.keys(bank) as GemColor[]).map((color) => {
          const amount = bank[color];
          const isSelected = selectedTokens.includes(color);
          const selectionCount = selectedTokens.filter(c => c === color).length;
          const style = gemStyles[color];
          return (
            <motion.button 
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTokenClick(color)}
              disabled={color === GemColor.Gold || amount === 0 || turnPhase !== 'MainAction'}
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 sm:border-4 flex items-center justify-center text-base sm:text-xl font-bold shadow-lg transition-all relative font-sans drop-shadow-md shrink-0
                ${style.chip}
                ${color === GemColor.Gold || turnPhase !== 'MainAction' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'ring-2 sm:ring-4 ring-emerald-400 ring-offset-2 ring-offset-zinc-900 scale-105' : ''}
              `}
            >
              <span className="absolute -top-4 text-lg  font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {amount}
              </span>
              <img
                src={gemIconSrc[color]}
                alt={color}
                className="pointer-events-none w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
              {selectionCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full text-[8px] sm:text-[10px] flex items-center justify-center text-white border-2 border-zinc-900 shadow-md">
                  {selectionCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="hidden lg:flex my-2 min-h-[36px] items-center justify-center">
        {renderActionButtons(false)}
      </div>
    </div>
  );
};
