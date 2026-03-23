import { useEffect, useRef, useState } from 'react';
import { GemColor, NobleTile as INobleTile } from '../game/models';
import { useElementSize } from '../hooks/useElementSize';
import { nobleImageFallback, nobleImageSrc } from '../utils/cardAssets';
import {
  costMinigemStyle,
  nobleCostSquareStyle,
  nobleSheetFaceStyle,
  numbersSheetDigitStyle,
  parseNobleSheetIndex1Based,
  prestigePointsSpriteStyle,
} from '../utils/splendorSprites';

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
  const nobleSheetIndex = parseNobleSheetIndex1Based(noble.id);
  const tileRef = useRef<HTMLButtonElement>(null);
  const { width: tileW, height: tileH } = useElementSize(tileRef);

  return (
    <button 
      ref={tileRef}
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
      {nobleSheetIndex != null ? (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={nobleSheetFaceStyle(nobleSheetIndex, tileW, tileH)}
        />
      ) : (
        <NobleFaceImage nobleId={noble.id} />
      )}
      <div className="relative z-10 w-full h-full flex flex-col bg-gradient-to-t from-black/35 via-transparent to-black/20 transition-colors lg:hover:from-black/25">
        
        {noble.prestigePoints > 0 &&
          (() => {
            const vpSm = prestigePointsSpriteStyle(noble.prestigePoints, 14);
            const vpMd = prestigePointsSpriteStyle(noble.prestigePoints, 22);
            const vpLg = prestigePointsSpriteStyle(noble.prestigePoints, 28);
            return (
              <div className="absolute top-0.5 right-1 sm:top-1 sm:right-1.5 lg:top-1.5 lg:right-2">
                {vpSm ? (
                  <>
                    <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] sm:hidden" style={vpSm} />
                    <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden sm:inline-block lg:hidden" style={vpMd!} />
                    <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] hidden lg:inline-block" style={vpLg!} />
                  </>
                ) : (
                  <span className="text-base font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] sm:text-2xl lg:text-3xl">
                    {noble.prestigePoints}
                  </span>
                )}
              </div>
            );
          })()}

        <div className="absolute bottom-1 left-1 flex flex-col gap-px sm:bottom-1.5 sm:left-1.5 sm:gap-0.5 lg:bottom-2 lg:left-2">
          {Object.entries(noble.requiredBonuses).map(([color, amount]) => {
            if (!amount || color === GemColor.Gold) return null;
            const gem = color as Exclude<GemColor, GemColor.Gold>;
            const sqSm = 14;
            const sqMd = 20;
            const sqLg = 24;
            const dSm = numbersSheetDigitStyle(amount, sqSm);
            const dMd = numbersSheetDigitStyle(amount, sqMd);
            const dLg = numbersSheetDigitStyle(amount, sqLg);
            return (
              <div key={color} className="flex items-center">
                <div className="relative shrink-0 drop-shadow-sm sm:hidden" style={{ width: sqSm, height: sqSm }}>
                  <div className="pointer-events-none absolute inset-0" style={nobleCostSquareStyle(gem, sqSm)} />
                  {dSm && <div className="pointer-events-none absolute inset-0" style={dSm} />}
                  <div style={costMinigemStyle(gem, sqSm, 'noble')} />
                </div>
                <div className="relative hidden shrink-0 drop-shadow-sm sm:block lg:hidden" style={{ width: sqMd, height: sqMd }}>
                  <div className="pointer-events-none absolute inset-0" style={nobleCostSquareStyle(gem, sqMd)} />
                  {dMd && <div className="pointer-events-none absolute inset-0" style={dMd} />}
                  <div style={costMinigemStyle(gem, sqMd, 'noble')} />
                </div>
                <div className="relative hidden shrink-0 drop-shadow-sm lg:block" style={{ width: sqLg, height: sqLg }}>
                  <div className="pointer-events-none absolute inset-0" style={nobleCostSquareStyle(gem, sqLg)} />
                  {dLg && <div className="pointer-events-none absolute inset-0" style={dLg} />}
                  <div style={costMinigemStyle(gem, sqLg, 'noble')} />
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </button>
  );
};
