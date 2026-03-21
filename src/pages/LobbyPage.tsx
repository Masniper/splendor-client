import React from "react";
import { Lobby } from "../components/Lobby";

type LobbyPageProps = {
  roomCode: string;
  players: Array<{ id: string; name: string; isHost?: boolean }>;
  isHost: boolean;
  theme: "light" | "dark";
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onLogout: () => void;
  localPlayerName: string;
  localUserId?: string | null;
};

export function LobbyPage(props: LobbyPageProps) {
  const {
    roomCode,
    players,
    isHost,
    theme,
    onStartGame,
    onLeaveRoom,
    onLogout,
    localPlayerName,
    localUserId,
  } = props;

  return (
    <Lobby
      roomCode={roomCode}
      players={players}
      isHost={isHost}
      onStartGame={onStartGame}
      onLeaveRoom={onLeaveRoom}
      onLogout={onLogout}
      theme={theme}
      localPlayerName={localPlayerName}
      localUserId={localUserId}
    />
  );
}

