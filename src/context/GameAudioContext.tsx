import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  playGameSound as playRaw,
  resumeAudioContext,
  type GameSoundId,
} from "../audio/gameAudio";

const STORAGE_KEY = "splendor:soundMuted";

type GameAudioContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (id: GameSoundId) => void;
};

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

export function GameAudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const unlock = () => resumeAudioContext();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const play = useCallback(
    (id: GameSoundId) => {
      if (muted) return;
      playRaw(id);
    },
    [muted],
  );

  const value = useMemo(
    () => ({ muted, toggleMuted, play }),
    [muted, toggleMuted, play],
  );

  return (
    <GameAudioContext.Provider value={value}>{children}</GameAudioContext.Provider>
  );
}

export function useGameAudio(): GameAudioContextValue {
  const ctx = useContext(GameAudioContext);
  if (!ctx) {
    throw new Error("useGameAudio must be used within GameAudioProvider");
  }
  return ctx;
}

export type { GameSoundId };
