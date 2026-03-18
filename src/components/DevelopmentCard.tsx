import { useState } from 'react';
import { motion } from 'framer-motion';
import { DevelopmentCard as IDevelopmentCard, GemColor, TurnPhase } from '../game/models';
import { gemStyles, gemIconSrc } from '../constants';

interface CardProps {
  card: IDevelopmentCard;
  onBuy?: () => void;
  onReserve?: () => void;
  affordable: boolean;
  turnPhase: TurnPhase;
  isReserved?: boolean;
}

export const DevelopmentCard = (props: CardProps) => {
  const { card, onBuy, onReserve, affordable, turnPhase, isReserved = false } = props;
  const [showMenu, setShowMenu] = useState(false);

  const style = gemStyles[card.colorBonus];
  const levelBorders = {
    1: 'border-emerald-700',
    2: 'border-amber-600',
    3: 'border-blue-700'
  };

  const levelBgs = {
    1: 'bg-emerald-900/20',
    2: 'bg-amber-900/20',
    3: 'bg-blue-900/20'
  };

  const isPurchasable = affordable && turnPhase === 'MainAction';

  const handleCardClick = () => {
    setShowMenu(!showMenu);
  };

  return (
    <motion.div 
      onClick={handleCardClick}
      onMouseLeave={() => setShowMenu(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={isPurchasable ? { 
        opacity: 1, 
        y: 0,
        scale: [1, 1.02, 1],
        transition: { scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }
      } : { opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -3 }}
      className={`w-full min-w-[70px] max-w-[85px] sm:min-w-[90px] sm:max-w-[130px] lg:max-w-[160px] lg:min-w-[120px] aspect-[2/3] shrink-0 rounded-xl border-2 ${levelBorders[card.level]} ${levelBgs[card.level]} p-0 flex flex-col justify-between shadow-md relative group overflow-hidden bg-cover bg-center transition-shadow cursor-pointer ${isPurchasable ? 'shadow-[0_0_15px_rgba(255,255,255,0.6)]' : ''}`}
      style={{ backgroundImage: `url(https://loremflickr.com/400/600/nature,landscape?lock=${card.id.replace('c-', '')})` }}
    >
      <div className="bg-white/30 backdrop-blur-md p-1 sm:p-1.5 flex justify-between items-start border-b border-white/20 rounded-t-xl">
        <div className="rounded-md px-1 py-0 min-w-[1rem] sm:min-w-[1.2rem] lg:min-w-[1.5rem] text-center">
          <span className="text-sm sm:text-lg lg:text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-serif">
            {card.prestigePoints > 0 ? card.prestigePoints : ''}
          </span>
        </div>
        <img
          src={gemIconSrc[card.colorBonus]}
          alt={card.colorBonus}
          className="object-contain w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]"
        />
      </div>

      <div className="flex flex-col gap-0.5 sm:gap-1 p-1 sm:p-1.5 w-fit mt-auto mb-1">
        {(Object.keys(card.cost) as GemColor[]).map((color) => {
          const amount = card.cost[color];
          if (!amount) return null;
          const cStyle = gemStyles[color];
          return (
            <div key={color} className="flex items-center">
              <div 
                className={`w-4.5 h-3.5 sm:w-7 sm:h-7 lg:w-6 lg:h-6 rounded-full ${cStyle.chip} border border-white/50 sm:border-2 flex items-center justify-center text-[8px] sm:text-[10px] lg:text-sm font-black font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
              >
                {amount}
              </div>
              <img
                src={gemIconSrc[color]}
                alt={color}
                className="w-3.5 h-3.5 sm:w-7 sm:h-7 lg:w-6 lg:h-6 object-contain -ml-1 sm:-ml-2 lg:-ml-2.5 z-10"
              />
            </div>
          );
        })}
      </div>
      
      {(onBuy || onReserve) && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 lg:gap-4 transition-all z-20 rounded-xl bg-black/70 backdrop-blur-sm 
          ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto'}`}
        >
          {onBuy && (turnPhase === 'MainAction' || isReserved) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onBuy(); setShowMenu(false); }} 
              disabled={!affordable || turnPhase !== 'MainAction'} 
              className={`w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-full shadow-md transition-all active:scale-95 ${affordable && turnPhase === 'MainAction' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.8)]' : 'bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed'}`}
            >
              Buy
            </button>
          )}
          {onReserve && !isReserved && turnPhase === 'MainAction' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onReserve(); setShowMenu(false); }} 
              className="w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/50 transition-all active:scale-95"
            >
              Reserve
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

interface DeckProps {
  level: 1 | 2 | 3;
  count: number;
  onReserve: () => void;
  turnPhase: TurnPhase;
}

export const Deck = (props: DeckProps) => {
  const { level, count, onReserve, turnPhase } = props;
  const [showMenu, setShowMenu] = useState(false);

  const bgColors = {
    1: 'bg-emerald-700',
    2: 'bg-amber-600',
    3: 'bg-blue-700'
  };
  const dots = Array.from({ length: level });

  return (
    <div 
      onClick={() => setShowMenu(!showMenu)}
      onMouseLeave={() => setShowMenu(false)}
      className={`w-full min-w-[70px] max-w-[85px] sm:min-w-[90px] sm:max-w-[130px] lg:max-w-[160px] aspect-[2/3] shrink-0 rounded-xl ${bgColors[level]} ring-1 ring-white/20 border-2 border-yellow-600/50 flex flex-col items-center justify-center shadow-lg relative group overflow-hidden cursor-pointer`}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      <span className="text-yellow-400 font-serif font-bold text-[10px] sm:text-lg lg:text-2xl drop-shadow-md relative z-10">Splendor</span>
      <span className="text-white/80 text-[8px] sm:text-xs lg:text-sm font-serif mt-0.5 sm:mt-1 relative z-10">{count} cards</span>
      
      <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-0 w-full flex justify-center gap-1 z-10">
        {dots.map((_, i) => <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-white rounded-full shadow-sm" />)}
      </div>
      
      {turnPhase === 'MainAction' && count > 0 && (
        <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center transition-opacity z-20 
          ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto'}`}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); onReserve(); setShowMenu(false); }} 
            className="w-[85%] max-w-[100px] py-2 sm:py-1.5 lg:py-2.5 text-xs lg:text-sm font-bold font-sans rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/50 transition-all active:scale-95"
          >
            Reserve
          </button>
        </div>
      )}
    </div>
  );
};
