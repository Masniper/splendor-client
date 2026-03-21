import React, { useState } from "react";
import { RoomChatPanel } from "./RoomChatPanel";
import { useGameAudio } from "../context/GameAudioContext";

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onLogout?: () => void;
  theme: "light" | "dark";
  localPlayerName: string;
  localUserId?: string | null;
}

export const Lobby = ({
  roomCode,
  players,
  isHost,
  onStartGame,
  onLeaveRoom,
  onLogout,
  theme,
  localPlayerName,
  localUserId,
}: LobbyProps) => {
  const { play } = useGameAudio();
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopyCode = () => {
    play("uiTap");
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500 bg-cover bg-center bg-fixed ${isDark ? 'text-stone-100' : 'text-gray-800'}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.6)"}, ${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.6)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      <div
        className={`p-8 rounded-3xl border-2 shadow-2xl max-w-lg w-full text-center relative z-10 transition-colors backdrop-blur-md
          ${isDark ? 'bg-zinc-900/90 border-zinc-700/70' : 'bg-white/95 border-gray-200/80'}
        `}
      >
        {/* {onLogout && (
          <div className="absolute top-4 left-4">
            <button
              onClick={onLogout}
              className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                isDark
                  ? 'bg-zinc-800 text-red-300 hover:bg-zinc-700 border border-zinc-700'
                  : 'bg-gray-100 text-red-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Logout
            </button>
          </div>
        )} */}
        <h2 className="text-3xl font-bold font-serif mb-2 text-amber-500 tracking-wide uppercase">Game Lobby</h2>
        <p className={`mb-6 text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          Waiting for other players to join...
        </p>

        {/* Room Code Section */}
        <div className={`p-6 rounded-2xl mb-8 border-2 ${isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Room Code
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className={`text-4xl font-mono font-bold tracking-[0.2em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className={`p-3 rounded-lg transition-all active:scale-95 ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : isDark ? 'bg-zinc-700 text-stone-300 hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          {copied && <p className="text-emerald-500 text-xs mt-2 font-bold animate-pulse">Code copied to clipboard!</p>}
        </div>

        {/* Players List */}
        <div className="mb-8 text-left">
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'border-zinc-700 text-stone-300' : 'border-gray-200 text-gray-600'}`}>
            Players ({players.length}/4)
          </h3>
          <ul className="space-y-3">
            {players.map((player, index) => (
              <li 
                key={player.id} 
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-zinc-800/50 border-zinc-700 text-stone-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${isDark ? 'bg-zinc-700 text-amber-400' : 'bg-gray-100 text-amber-600'}`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-lg">{player.name}</span>
                </div>
                {player.isHost && (
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 text-left">
          <RoomChatPanel
            roomCode={roomCode}
            theme={theme}
            localPlayerName={localPlayerName}
            localUserId={localUserId}
            layout="embedded"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              play("uiTap");
              onLeaveRoom();
            }}
            className={`flex-1 py-4 rounded-xl font-bold transition-all ${isDark ? 'bg-red-900/50 text-red-200 hover:bg-red-900/80 border border-red-900' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
          >
            Leave
          </button>
          
          {isHost ? (
            <button
              type="button"
              onClick={() => {
                play("uiTap");
                onStartGame();
              }}
              disabled={players.length < 2}
              className="flex-[2] py-4 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {players.length < 2 ? 'Need more players...' : 'Start Game'}
            </button>
          ) : (
            <div className={`flex-[2] py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isDark ? 'bg-zinc-800 text-stone-400' : 'bg-gray-100 text-gray-500'}`}>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Waiting for host...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
