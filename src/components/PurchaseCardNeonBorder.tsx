import { motion } from "framer-motion";

type PurchaseNeonBorderRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  ry: number;
};

interface PurchaseCardNeonBorderProps {
  clipPathId: string;
  borderRect: PurchaseNeonBorderRect;
  outerStroke: string;
  innerStroke: string;
  outerStrokeKeyframes: string[];
  innerStrokeKeyframes: string[];
  reduceMotion: boolean;
  outerColorCycleDurationSec: number;
  innerColorCycleDurationSec: number;
}

export function PurchaseCardNeonBorder({
  clipPathId,
  borderRect,
  outerStroke,
  innerStroke,
  outerStrokeKeyframes,
  innerStrokeKeyframes,
  reduceMotion,
  outerColorCycleDurationSec,
  innerColorCycleDurationSec,
}: PurchaseCardNeonBorderProps) {
  const clipPadding = 20;
  const clipRx = borderRect.rx + 12;
  const clipRy = borderRect.ry + 12;
  const clipX = -clipPadding;
  const clipY = -clipPadding;
  const clipW = 100 + clipPadding * 2;
  const clipH = 150 + clipPadding * 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-12 rounded-xl">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect
              x={clipX}
              y={clipY}
              width={clipW}
              height={clipH}
              rx={clipRx}
              ry={clipRy}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipPathId})`}>
          <>
            <motion.rect
              x={borderRect.x}
              y={borderRect.y}
              width={borderRect.w}
              height={borderRect.h}
              rx={borderRect.rx}
              ry={borderRect.ry}
              fill="none"
              stroke={outerStroke}
              strokeWidth={3.4}
              strokeLinecap="round"
              strokeDasharray="none"
              style={{ filter: "none" }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      stroke: outerStrokeKeyframes,
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      repeat: Infinity,
                    duration: outerColorCycleDurationSec,
                      ease: "linear",
                    }
              }
            />
          </>
        </g>
      </svg>
    </div>
  );
}

