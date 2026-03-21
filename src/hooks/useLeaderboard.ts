import { useCallback, useState } from "react";

// Use same-origin API behind Nginx. Optionally override at build time.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string | null;
  profile_picture: string | null;
  xp: number;
  coins: number;
  wins: number;
  losses: number;
  winRate: number;
};

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/leaderboard?limit=${limit}`,
      );
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Failed to load leaderboard");
      }
      const rows = data.data as LeaderboardEntry[] | undefined;
      if (!Array.isArray(rows)) {
        throw new Error("Invalid leaderboard response");
      }
      setEntries(rows);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load leaderboard";
      setError(message);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { entries, isLoading, error, fetchLeaderboard };
}
