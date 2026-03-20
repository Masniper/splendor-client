import { useEffect, useState } from 'react';
import { GemColor, NobleTile as INobleTile } from '../game/models';
import { gemStyles } from '../constants';
import { nobleImageFallback, nobleImageSrc } from '../utils/cardAssets';

function NobleFaceImage({ nobleId }: { nobleId: string }) {
  const [src, setSrc] = useState(() => nobleImageSrc(nobleId));

  useEffect(() => {
    setSrc(nobleImageSrc(nobleId));
  }, [nobleId]);

  return (
    <img
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() =>
        setSrc((prev) =>
          prev === nobleImageFallback(nobleId) ? prev : nobleImageFallback(nobleId)
        )
      }
    />
  );
}

interface NobleTileProps {
  noble: INobleTile;
  onClick?: () => void;
  isSelectable?: boolean;
}

export const NobleTile = ({ noble, onClick, isSelectable }: NobleTileProps) => {
  return (
    <button 
      onClick={onClick}
      disabled={!isSelectable && !onClick}
      className={`
        w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 
        rounded-lg sm:rounded-xl ring-2 shadow-xl 
        relative overflow-hidden bg-stone-800 shrink-0 transition-all duration-200
        ${isSelectable 
          ? 'cursor-pointer ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] lg:hover:scale-105 active:scale-95' 
          : 'cursor-default ring-yellow-600/80 opacity-95'
        }
      `}
    >
      <NobleFaceImage nobleId={noble.id} />
      <div className="relative z-10 bg-black/40 backdrop-blur-[2px] w-full h-full flex flex-col transition-colors lg:hover:bg-black/30">
        
        {noble.prestigePoints > 0 && (
          <div className="absolute top-0.5 sm:top-1 lg:top-1.5 right-1 sm:right-1.5 lg:right-2 text-base sm:text-2xl lg:text-3xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-serif">
            {noble.prestigePoints}
          </div>
        )}

        <div className="flex flex-col gap-px sm:gap-0.5 absolute bottom-1 sm:bottom-1.5 lg:bottom-2 left-1 sm:left-1.5 lg:left-2">
          {Object.entries(noble.requiredBonuses).map(([color, amount]) => (
            <div 
              key={color} 
              className={`
                w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 
                rounded sm:rounded-md border border-white/40 
                flex items-center justify-center
                text-[8px] sm:text-[10px] lg:text-xs font-bold 
                shadow-inner font-sans drop-shadow-sm 
                ${gemStyles[color as GemColor].chip}
              `}
            >
              {amount}
            </div>
          ))}
        </div>
        
      </div>
    </button>
  );
};
