import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OpponentProfileData } from "../hooks/useOpponentProfile";

type OpponentProfileModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  profile: OpponentProfileData | null;
  onClose: () => void;
  theme: "light" | "dark";
};

const statValue = (value?: number) => value ?? 0;

export function OpponentProfileModal({
  isOpen,
  isLoading,
  error,
  profile,
  onClose,
  theme,
}: OpponentProfileModalProps) {
  const isDark = theme === "dark";
  const initials = (profile?.username || "U").trim().charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${
              isDark
                ? "bg-zinc-900 border-zinc-700 text-stone-100"
                : "bg-white border-gray-200 text-gray-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-serif text-amber-500">
                Opponent Profile
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full w-8 h-8 font-bold ${
                  isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100"
                }`}
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
                Loading profile...
              </div>
            ) : error ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-red-500/50 bg-red-900/40 text-red-200"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-amber-500/60 bg-zinc-700/40">
                    {profile.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt="Opponent avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg font-black text-white">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-bold">{profile.username}</div>
                    <div
                      className={`text-xs ${
                        isDark ? "text-stone-400" : "text-gray-500"
                      }`}
                    >
                      Player Statistics
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 border ${isDark ? "border-zinc-700 bg-zinc-800/70" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-xs opacity-70">XP</div>
                    <div className="text-xl font-black text-amber-500">{statValue(profile.xp)}</div>
                  </div>
                  <div className={`rounded-xl p-3 border ${isDark ? "border-zinc-700 bg-zinc-800/70" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-xs opacity-70">Coins</div>
                    <div className="text-xl font-black text-emerald-500">{statValue(profile.coins)}</div>
                  </div>
                  <div className={`rounded-xl p-3 border ${isDark ? "border-zinc-700 bg-zinc-800/70" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-xs opacity-70">Wins / Losses</div>
                    <div className="text-lg font-black">
                      {statValue(profile.wins)} / {statValue(profile.losses)}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 border ${isDark ? "border-zinc-700 bg-zinc-800/70" : "border-gray-200 bg-gray-50"}`}>
                    <div className="text-xs opacity-70">Win Rate</div>
                    <div className="text-xl font-black text-sky-500">
                      {Number(profile.winRate ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div className={`rounded-xl p-3 border text-sm ${isDark ? "border-zinc-700 bg-zinc-800/70 text-stone-300" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                    {profile.bio}
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
