import React from "react";
import { GameSetup } from "../components/GameSetup";

type SetupPageProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;

  publicRooms: Array<{
    id: string;
    hostName: string;
    playerCount: number;
    status?: string;
    canJoin?: boolean;
  }>;
  isLoadingPublicRooms: boolean;
  onListPublicRooms: () => void;

  onCreateRoom: (name: string, isPublic?: boolean) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  onJoinPublicRoom: (roomId: string) => void;

  onLogout: () => void;
};

export function SetupPage(props: SetupPageProps) {
  const {
    theme,
    onThemeToggle,
    publicRooms,
    isLoadingPublicRooms,
    onListPublicRooms,
    onCreateRoom,
    onJoinRoom,
    onJoinPublicRoom,
    onLogout,
  } = props;

  return (
    <GameSetup
      theme={theme}
      onThemeToggle={onThemeToggle}
      publicRooms={publicRooms}
      isLoadingPublicRooms={isLoadingPublicRooms}
      onListPublicRooms={onListPublicRooms}
      onCreateRoom={onCreateRoom}
      onJoinRoom={onJoinRoom}
      onJoinPublicRoom={onJoinPublicRoom}
      onLogout={onLogout}
    />
  );
}

