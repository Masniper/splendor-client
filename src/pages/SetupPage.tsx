import React from "react";
import { GameSetup } from "../components/GameSetup";
import type { PublicRoomRow } from "../hooks/useOnlineGame";

type SetupPageProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;

  publicRooms: PublicRoomRow[];
  isLoadingPublicRooms: boolean;
  onListPublicRooms: () => void;

  onCreateRoom: (roomName: string, isPublic?: boolean, betAmount?: number) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  onJoinPublicRoom: (roomId: string) => void;

  onLogout: () => void;
  currentUsername: string;
  currentUserAvatarUrl?: string | null;
  onOpenProfile: () => void;
  userCoins?: number | null;
  onNotify?: (message: string, type?: "error" | "success") => void;
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
    currentUsername,
    currentUserAvatarUrl,
    onOpenProfile,
    userCoins,
    onNotify,
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
      currentUsername={currentUsername}
      currentUserAvatarUrl={currentUserAvatarUrl}
      onOpenProfile={onOpenProfile}
      userCoins={userCoins}
      onNotify={onNotify}
    />
  );
}

