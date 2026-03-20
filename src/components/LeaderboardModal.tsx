import React, { useEffect } from "react";
import { X } from "lucide-react";
import {
  useLeaderboard,
  type LeaderboardEntry,
} from "../hooks/useLeaderboard";

type LeaderboardModalProps = {
  open: boolean;
  onClose: () => void;
  theme: "light" | "dark";
};

export function LeaderboardModal({ open, onClose, theme }: LeaderboardModalProps) {
  const isDark = theme === "dark";
  const { entries, isLoading, error, fetchLeaderboard } = useLeaderboard();

  useEffect(() => {
    if (open) {
      void fetchLeaderboard(25);
    }
  }, [open, fetchLeaderboard]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl ${
          isDark
            ? "border-zinc-600 bg-zinc-900"
            : "border-gray-200 bg-white"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${
            isDark ? "border-zinc-700" : "border-gray-200"
          }`}
        >
          <h2
            id="leaderboard-title"
            className={`font-serif text-xl font-bold ${isDark ? "text-stone-100" : "text-gray-900"}`}
          >
            Leaderboard
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${
              isDark
                ? "text-stone-400 hover:bg-zinc-800 hover:text-stone-200"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-5rem)] overflow-y-auto p-4">
          {isLoading && (
            <p className={`text-center text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}>
              Loading…
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}
          {!isLoading && !error && entries.length === 0 && (
            <p className={`text-center text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}>
              No players yet.
            </p>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm">
                <thead>
                  <tr
                    className={`border-b text-xs uppercase tracking-wide ${isDark ? "border-zinc-700 text-stone-500" : "border-gray-200 text-gray-500"}`}
                  >
                    <th className="w-10 pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">Player</th>
                    <th className="w-14 pb-2 text-right">XP</th>
                    <th className="w-14 pb-2 text-right">W</th>
                    <th className="w-16 pb-2 text-right">WR%</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row: LeaderboardEntry) => (
                    <tr
                      key={row.id}
                      className={`border-t ${isDark ? "border-zinc-800" : "border-gray-100"}`}
                    >
                      <td className="py-2.5 pr-2 font-mono text-xs font-bold text-amber-500">
                        {row.rank}
                      </td>
                      <td className="py-2.5 pr-2">
                        <div
                          className={`truncate font-semibold ${isDark ? "text-stone-100" : "text-gray-900"}`}
                        >
                          {row.username || "Anonymous"}
                        </div>
                        <div
                          className={`truncate text-xs ${isDark ? "text-stone-500" : "text-gray-500"}`}
                        >
                          {row.coins} coins
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.xp}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.wins}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {row.winRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
