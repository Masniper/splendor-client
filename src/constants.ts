import { GemColor } from './game/models';

export const gemStyles: Record<GemColor, { chip: string; border: string }> = {
  [GemColor.Emerald]: {
    chip: 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-800 text-white shadow-inner',
    border: 'border-emerald-600',
  },
  [GemColor.Diamond]: {
    chip: 'bg-gradient-to-br from-gray-50 to-gray-200 border-gray-400 text-gray-900 shadow-inner',
    border: 'border-gray-300',
  },
  [GemColor.Sapphire]: {
    chip: 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-800 text-white shadow-inner',
    border: 'border-blue-600',
  },
  [GemColor.Onyx]: {
    chip: 'bg-gradient-to-br from-gray-700 to-gray-900 border-gray-950 text-white shadow-inner',
    border: 'border-gray-800',
  },
  [GemColor.Ruby]: {
    chip: 'bg-gradient-to-br from-red-500 to-red-700 border-red-800 text-white shadow-inner',
    border: 'border-red-600',
  },
  [GemColor.Gold]: {
    chip: 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-600 text-yellow-900 shadow-inner',
    border: 'border-yellow-500',
  },
};

export const gemStylesBank: Record<GemColor, { chip: string; border: string }> = {
  [GemColor.Emerald]: {
    chip: 'bg-gradient-to-br from-[#EAE4BE] to-[#5C7C55] border-emerald-800 text-white shadow-inner',
    border: 'border-emerald-600',
  },
  [GemColor.Diamond]: {
    chip: 'bg-gradient-to-br from-[#BFA697] to-[#7F645D] border-gray-400 text-gray-900 shadow-inner',
    border: 'border-gray-300',
  },
  [GemColor.Sapphire]: {
    chip: 'bg-gradient-to-br from-[#E8E2CE] to-[#B08775] border-blue-800 text-white shadow-inner',
    border: 'border-blue-600',
  },
  [GemColor.Onyx]: {
    chip: 'bg-gradient-to-br from-[#DBA26C] to-[#625251] border-gray-950 text-white shadow-inner',
    border: 'border-gray-800',
  },
  [GemColor.Ruby]: {
    chip: 'bg-gradient-to-br from-[#EFC0A8] to-[#987873] border-red-800 text-white shadow-inner',
    border: 'border-red-600',
  },
  [GemColor.Gold]: {
    chip: 'bg-gradient-to-br from-[#E8C6B9] to-yellow-500 border-yellow-600 text-yellow-900 shadow-inner',
    border: 'border-yellow-500',
  },
};

// Map each gem color to its PNG icon path (served from public `/icons`)
export const gemIconSrc: Record<GemColor, string> = {
  [GemColor.Emerald]: '/icons/emerald.png',
  [GemColor.Diamond]: '/icons/diamond.png',
  [GemColor.Sapphire]: '/icons/sapphire.png',
  [GemColor.Onyx]: '/icons/onyx.png',
  [GemColor.Ruby]: '/icons/ruby.png',
  [GemColor.Gold]: '/icons/gold.png',
};
