import { GameState, GemColor, Player } from '../game/models';
import { NobleTile } from './NobleTile';
import { DevelopmentCard, Deck } from './DevelopmentCard';
import { TokenBank } from './TokenBank';
import { canAffordCard } from '../utils/gameView';

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
  isDark 
}: CenterBoardProps) => {
  return (
    <div className="flex-1 flex flex-col gap-4 order-2 lg:order-none min-w-0 ">
      {/* Nobles */}
      <div className={`p-3 rounded-2xl border shadow-inner shrink-0 transition-colors flex flex-col ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
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

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        
        {/* Cards Grid (Main Decks) */}
        <div className={`flex-1 flex flex-col gap-3 p-3 rounded-2xl border transition-colors overflow-x-auto ${isDark ? 'bg-zinc-800/30 border-zinc-700/30' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-serif ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
              Main Decks
            </h3>
          </div>
          {[3, 2, 1].map((level) => (
            <div key={level} className="grid grid-cols-5 gap-2 sm:gap-3 min-w-0">
              <Deck 
                level={level as 1|2|3} 
                count={gameState.decks[`level${level}` as keyof typeof gameState.decks].length} 
                onReserve={() => onReserveFromDeck(level as 1|2|3)} 
                turnPhase={gameState.turnPhase} 
                isDark={isDark}
              />
              {gameState.boardCards[`level${level}` as keyof typeof gameState.boardCards].map((card) => (
                <div key={card.id}>
                  <DevelopmentCard 
                    card={card} 
                    affordable={canAffordCard(currentPlayer, card)}
                    turnPhase={gameState.turnPhase}
                    onBuy={() => onBuyCard(card.id)}
                    onReserve={() => onReserveCard(card.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bank / Tokens */}
        <div className="shrink-0 flex w-full lg:w-auto justify-center lg:justify-start">
          <TokenBank 
            bank={gameState.bank}
            selectedTokens={selectedTokens}
            onTokenClick={onTokenClick}
            onTakeTokens={onTakeTokens}
            onClear={onClearTokens}
            turnPhase={gameState.turnPhase}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};
