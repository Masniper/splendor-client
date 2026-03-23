import { useId, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { GemColor } from "../game/models";

type PurchaseNeonLevel = 1 | 2 | 3;

type PurchaseNeonInput = {
  colorBonus: Exclude<GemColor, GemColor.Gold>;
  level: PurchaseNeonLevel;
};

type PurchaseNeonBorderRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  ry: number;
};

const defaultBorderColorByLevel: Record<PurchaseNeonLevel, string> = {
  1: "#047857", // emerald-700
  2: "#d97706", // amber-600
  3: "#1d4ed8", // blue-700
};

const neonPaletteByBonus: Record<
  Exclude<GemColor, GemColor.Gold>,
  [string, string, string, string]
> = {
  Emerald: [
    "rgba(16, 185, 129, 0.98)",
    "rgba(34, 211, 238, 0.9)",
    "rgba(168, 255, 80, 0.85)",
    "rgba(245, 158, 11, 0.85)",
  ],
  Diamond: [
    "rgba(226, 232, 240, 0.98)",
    "rgba(59, 130, 246, 0.9)",
    "rgba(34, 211, 238, 0.85)",
    "rgba(167, 139, 250, 0.82)",
  ],
  Sapphire: [
    "rgba(37, 99, 235, 0.98)",
    "rgba(34, 211, 238, 0.9)",
    "rgba(99, 102, 241, 0.85)",
    "rgba(59, 130, 246, 0.85)",
  ],
  Onyx: [
    "rgba(167, 139, 250, 0.9)",
    "rgba(34, 211, 238, 0.85)",
    "rgba(59, 130, 246, 0.8)",
    "rgba(226, 232, 240, 0.75)",
  ],
  Ruby: [
    "rgba(239, 68, 68, 0.98)",
    "rgba(236, 72, 153, 0.88)",
    "rgba(245, 158, 11, 0.85)",
    "rgba(34, 211, 238, 0.82)",
  ],
};

export function usePurchaseCardNeon({ colorBonus, level }: PurchaseNeonInput) {
  const reduceMotion = useReducedMotion();
  const reactId = useId();

  const lightningClipPathId = useMemo(() => {
    const cleaned = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
    return `lightning-card-clip-${cleaned}`;
  }, [reactId]);

  const palette = neonPaletteByBonus[colorBonus];
  const outerStroke = palette[0]!;
  const innerStroke = palette[2]!;

  // Keep geometry stable for a consistent clipping border.
  const borderRect: PurchaseNeonBorderRect = useMemo(
    () => ({ x: 3, y: 3, w: 94, h: 144, rx: 10, ry: 10 }),
    [],
  );

  // Match the earlier "good" timing after removing sparkSegments:
  // outer ~1.7s, inner ~1.25s.
  const outerColorCycleDurationSec = 1.7;
  const innerColorCycleDurationSec = 1.25;

  const outerStrokeKeyframes = reduceMotion ? [outerStroke] : palette;
  // Inner stroke uses a shifted palette so the neon feels "electric" but not flickery.
  const innerStrokeKeyframes = reduceMotion ? [innerStroke] : [palette[2], palette[3], palette[1], palette[0]];

  const neonBoxShadowKeyframes = useMemo(() => {
    // Boost glow intensity without adding pulsing.
    const alphaWhite = 0.22;
    const makeShadow = (c: string) =>
      `0 0 0 1.6px ${c}, 0 0 12px ${c}, 0 0 36px rgba(255,255,255,${alphaWhite}), 0 0 22px ${c}`;
    return outerStrokeKeyframes.map(makeShadow);
  }, [outerStrokeKeyframes]);

  const neonBoxShadowStatic = neonBoxShadowKeyframes[0] ?? "none";

  const defaultBorderColor = defaultBorderColorByLevel[level]!;

  return {
    reduceMotion,
    lightningClipPathId,
    borderRect,
    outerStrokeKeyframes,
    innerStrokeKeyframes,
    outerStroke,
    innerStroke,
    outerColorCycleDurationSec,
    innerColorCycleDurationSec,
    neonBoxShadowKeyframes,
    neonBoxShadowStatic,
    defaultBorderColor,
  };
}

