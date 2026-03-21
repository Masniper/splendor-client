import { useCallback, useState } from "react";

// Use same-origin API behind Nginx. Optionally override at build time.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface OpponentProfileData {
  id: string;
  username: string;
  profile_picture?: string | null;
  bio?: string | null;
  coins?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
}

export function useOpponentProfile() {
  const [profile, setProfile] = useState<OpponentProfileData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openOpponentProfile = useCallback(async (userId: string) => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/public`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok || !data?.data) {
        throw new Error(data?.error || data?.message || "Failed to load profile");
      }
      setProfile(data.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeOpponentProfile = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    profile,
    isOpen,
    isLoading,
    error,
    openOpponentProfile,
    closeOpponentProfile,
  };
}
