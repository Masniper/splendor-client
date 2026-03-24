import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  playGameSound as playRaw,
  resumeAudioContext,
  startBackgroundMusic,
  stopBackgroundMusic,
  getSavedMusicTrack,
  saveMusicTrack,
  MUSIC_TRACKS,
  type GameSoundId,
  type MusicTrackId,
} from "../audio/gameAudio";

const STORAGE_KEY = "splendor:soundMuted";

type GameAudioContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (id: GameSoundId) => void;
  startMusic: () => void;
  stopMusic: () => void;
  musicTrack: MusicTrackId;
  setMusicTrack: (id: MusicTrackId) => void;
  musicTracks: typeof MUSIC_TRACKS;
};

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

export function GameAudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [musicTrack, setMusicTrackState] = useState<MusicTrackId>('mystic');
  const musicActiveRef = useRef(false);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setMusicTrackState(getSavedMusicTrack());
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

  // Sync music playback with mute state changes
  useEffect(() => {
    if (muted && musicActiveRef.current) {
      stopBackgroundMusic();
    } else if (!muted && musicActiveRef.current) {
      startBackgroundMusic();
    }
  }, [muted]);

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

  const startMusic = useCallback(() => {
    musicActiveRef.current = true;
    if (!muted) startBackgroundMusic(musicTrack);
  }, [muted, musicTrack]);

  const stopMusic = useCallback(() => {
    musicActiveRef.current = false;
    stopBackgroundMusic();
  }, []);

  const setMusicTrack = useCallback((id: MusicTrackId) => {
    saveMusicTrack(id);
    setMusicTrackState(id);
    if (musicActiveRef.current && !muted) {
      startBackgroundMusic(id);
    } else if (id === 'none') {
      stopBackgroundMusic();
    }
  }, [muted]);

  const value = useMemo(
    () => ({ muted, toggleMuted, play, startMusic, stopMusic, musicTrack, setMusicTrack, musicTracks: MUSIC_TRACKS }),
    [muted, toggleMuted, play, startMusic, stopMusic, musicTrack, setMusicTrack],
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

export type { GameSoundId, MusicTrackId };
