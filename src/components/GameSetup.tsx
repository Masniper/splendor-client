import React, { useState, useEffect } from "react";
import { Coins, Plus, RefreshCw, Trophy } from "lucide-react";
import type { PublicRoomRow } from "../hooks/useOnlineGame";
import { LeaderboardModal } from "./LeaderboardModal";

interface GameSetupProps {
  onCreateRoom: (
    roomName: string,
    isPublic?: boolean,
    betAmount?: number,
  ) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  isLoadingPublicRooms?: boolean;
  onLogout?: () => void;
  publicRooms?: PublicRoomRow[];
  onListPublicRooms?: () => void;
  onJoinPublicRoom?: (roomId: string) => void;
  currentUsername?: string;
  currentUserAvatarUrl?: string | null;
  onOpenProfile?: () => void;
  /** Current coin balance for bet limits (optional). */
  userCoins?: number | null;
  onNotify?: (message: string, type?: "error" | "success") => void;
}

export const GameSetup = ({
  onCreateRoom,
  onJoinRoom,
  theme,
  onThemeToggle,
  isLoadingPublicRooms = false,
  onLogout,
  publicRooms = [],
  onListPublicRooms = () => {},
  onJoinPublicRoom = () => {},
  currentUsername = "User",
  currentUserAvatarUrl = null,
  onOpenProfile,
  userCoins = null,
  onNotify,
}: GameSetupProps) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [roomName, setRoomName] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [createModalError, setCreateModalError] = useState<string | null>(null);

  const isDark = theme === "dark";

  const parsedBetAmount = Number.parseInt(betAmount || "0", 10);
  const normalizedBetAmount =
    Number.isFinite(parsedBetAmount) && parsedBetAmount > 0
      ? parsedBetAmount
      : 0;

  useEffect(() => {
    onListPublicRooms();
    const id = window.setInterval(() => onListPublicRooms(), 8000);
    return () => window.clearInterval(id);
  }, [onListPublicRooms]);

  useEffect(() => {
    if (showCreateModal) {
      setCreateModalError(null);
    }
  }, [showCreateModal]);

  useEffect(() => {
    setCreateModalError(null);
  }, [betAmount, roomName, isPublic]);

  const notify = (message: string, type: "error" | "success" = "error") => {
    onNotify?.(message, type);
  };

  const handleCreate = () => {
    if (isConnecting) return;
    setCreateModalError(null);

    if (normalizedBetAmount > 0) {
      if (userCoins === null || userCoins === undefined) {
        const msg =
          "Your balance is still loading. Please wait a moment, then try again.";
        setCreateModalError(msg);
        notify(msg, "error");
        return;
      }
      if (normalizedBetAmount > userCoins) {
        const msg = `Bet cannot exceed your balance (${userCoins} coins). Lower the amount or earn more coins.`;
        setCreateModalError(msg);
        notify(msg, "error");
        return;
      }
    }

    setIsConnecting(true);
    onCreateRoom(roomName, isPublic, normalizedBetAmount);
    setShowCreateModal(false);
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code || isConnecting) {
      if (!code) notify("Enter a room code first.", "error");
      return;
    }
    setIsConnecting(true);
    onJoinRoom("", code);
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const handleJoinPublic = (room: PublicRoomRow) => {
    const bet = room.betAmount ?? 0;
    if (
      bet > 0 &&
      userCoins !== null &&
      userCoins !== undefined &&
      bet > userCoins
    ) {
      notify("You do not have enough coins to join this room.", "error");
      return;
    }
    if (room.canJoin === false) return;
    onJoinPublicRoom(room.id);
  };

  const LoadingSpinner = () => (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const getStatusBadge = (status?: string) => {
    if (status === "playing") {
      return (
        <span className="inline-flex rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
          In progress
        </span>
      );
    }
    return (
      <span className="inline-flex rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
        Waiting
      </span>
    );
  };

  const activePublicRooms = publicRooms.filter(
    (room) => room.status !== "finished",
  );
  const avatarInitial =
    currentUsername.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center bg-fixed p-4 font-sans transition-colors duration-500 ${isDark ? "text-stone-100" : "text-gray-800"}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        theme={theme}
      />

      <div className="absolute right-3 top-3 z-50 flex items-start gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
        <div className="flex max-w-[min(100vw-6rem,11rem)] flex-col items-end gap-1 sm:max-w-none">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className={`flex min-w-[7.25rem] max-w-[10.5rem] items-center gap-1.5 rounded border py-1 pl-1 pr-2 shadow-sm transition-colors sm:min-w-[8rem] sm:max-w-[11rem] sm:gap-2 sm:pr-2.5 ${
                isDark
                  ? "border-zinc-600 bg-zinc-800 text-stone-200 hover:bg-zinc-700"
                  : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded border border-amber-500/50 bg-zinc-700/40 sm:h-8 sm:w-8">
                {currentUserAvatarUrl ? (
                  <img
                    src={currentUserAvatarUrl}
                    alt="User avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white sm:text-xs">
                    {avatarInitial}
                  </div>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-medium sm:text-sm">
                {currentUsername}
              </span>
            </button>

            {showUserMenu && (
              <div
                className={`absolute right-0 mt-1.5 min-w-[10rem] rounded border p-0.5 shadow-lg ${
                  isDark
                    ? "border-zinc-600 bg-zinc-900"
                    : "border-gray-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile?.();
                  }}
                  className={`w-full rounded-sm px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                    isDark
                      ? "text-stone-200 hover:bg-zinc-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Profile
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className={`w-full rounded-sm px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                      isDark
                        ? "text-red-300 hover:bg-zinc-800"
                        : "text-red-600 hover:bg-gray-100"
                    }`}
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
          {userCoins !== null && userCoins !== undefined && (
            <div
              className={`flex w-full min-w-[7.25rem] max-w-[10.5rem] items-center justify-end gap-1.5 rounded border px-2 py-0.5 shadow-sm sm:min-w-[8rem] sm:max-w-[11rem] ${
                isDark
                  ? "border-zinc-600/90 bg-zinc-900/95 text-stone-300"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              <Coins
                className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-amber-500/90" : "text-amber-600"}`}
                aria-hidden
              />
              <span
                className={`text-[11px] font-medium uppercase tracking-wide ${isDark ? "text-stone-500" : "text-gray-500"}`}
              >
                Balance
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${isDark ? "text-amber-200" : "text-gray-900"}`}
              >
                {userCoins}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onThemeToggle}
          className={`rounded border p-1.5 text-sm shadow-sm transition-colors sm:p-2 ${
            isDark
              ? "border-zinc-600 bg-zinc-800 text-amber-400 hover:bg-zinc-700"
              : "border-gray-300 bg-gray-100 text-amber-600 hover:bg-gray-200"
          }`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div
        className={`relative z-10 mt-14 w-full max-w-5xl rounded-lg border px-3 py-5 shadow-xl backdrop-blur-sm transition-colors sm:mt-0 sm:rounded-md sm:p-6 md:p-8 ${
          isDark
            ? "border-zinc-700/80 bg-zinc-900/90"
            : "border-gray-200/90 bg-white/95"
        }`}
      >
        <div className="mb-5 sm:mb-6">
          <h1 className="mb-1 font-serif text-3xl font-bold uppercase tracking-wide text-amber-500 drop-shadow-md sm:mb-2 sm:text-4xl sm:tracking-wider md:text-5xl lg:text-6xl">
            Splendor
          </h1>
          <p
            className={`font-sans text-base sm:text-lg ${isDark ? "text-stone-400" : "text-gray-600"}`}
          >
            Online Multiplayer Edition
          </p>
        </div>

        <div
          className={`mb-5 flex flex-col gap-2 rounded-md border p-2.5 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:p-3 ${
            isDark ? "border-zinc-700/80 bg-zinc-800/40" : "border-gray-200/90 bg-gray-50/80"
          }`}
        >
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded border px-3 text-sm font-semibold shadow-sm transition-all active:scale-[0.99] ${
              isDark
                ? "border border-amber-600/40 bg-amber-600/90 text-white hover:bg-amber-500"
                : "border border-amber-500/30 bg-amber-600 text-white hover:bg-amber-500"
            }`}
            title="New room"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Room
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <input
              type="text"
              placeholder="6-letter code"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              maxLength={8}
              disabled={isConnecting}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
              className={`h-9 min-w-0 flex-1 rounded border px-2.5 font-sans text-sm uppercase tracking-wider shadow-inner outline-none ring-0 transition-all placeholder:font-normal placeholder:normal-case placeholder:tracking-normal disabled:opacity-50 sm:px-3 sm:tracking-widest ${
                isDark
                  ? "border-zinc-600 bg-zinc-900/80 text-stone-100 placeholder:text-stone-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-200"
              }`}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={!roomCode.trim() || isConnecting}
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded border px-3 text-sm font-semibold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:px-4 ${
                isDark
                  ? "border-amber-500/25 bg-zinc-800/90 text-amber-100 hover:border-amber-500/40 hover:bg-zinc-700"
                  : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50/90"
              }`}
            >
              {isConnecting ? (
                <>
                  <svg
                    className={`h-3.5 w-3.5 animate-spin ${isDark ? "text-amber-400" : "text-amber-700"}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-xs">…</span>
                </>
              ) : (
                "Join"
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded border px-2.5 text-sm font-semibold transition-all active:scale-[0.99] sm:px-3 ${
              isDark
                ? "border-zinc-600 bg-zinc-800/80 text-amber-400/95 hover:bg-zinc-700"
                : "border-gray-300 bg-white text-amber-800 hover:bg-gray-50"
            }`}
          >
            <Trophy className="h-4 w-4 shrink-0" />
            Leaderboard
          </button>
        </div>

        <div
          className={`rounded-md border p-3 sm:p-4 md:p-5 ${
            isDark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
            <h2
              className={`font-serif text-lg font-bold sm:text-xl ${isDark ? "text-stone-200" : "text-gray-800"}`}
            >
              Public Rooms
            </h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`text-xs tabular-nums sm:text-sm ${isDark ? "text-stone-400" : "text-gray-500"}`}
              >
                {activePublicRooms.length} rooms
              </span>
              <button
                type="button"
                onClick={() => onListPublicRooms()}
                disabled={isLoadingPublicRooms}
                title="Refresh list"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border transition-all active:scale-95 disabled:opacity-50 sm:h-10 sm:w-10 ${
                  isDark
                    ? "border-zinc-600 bg-zinc-900 text-stone-300 hover:bg-zinc-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoadingPublicRooms ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {isLoadingPublicRooms ? (
            <div
              className={`rounded-md border p-6 text-center sm:p-8 ${
                isDark ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-white"
              }`}
            >
              <p
                className={`text-sm sm:text-base ${isDark ? "text-stone-400" : "text-gray-600"}`}
              >
                Loading rooms…
              </p>
            </div>
          ) : activePublicRooms.length === 0 ? (
            <div
              className={`rounded-md border p-6 text-center sm:p-8 ${
                isDark ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-white"
              }`}
            >
              <p
                className={`text-sm sm:text-base ${isDark ? "text-stone-400" : "text-gray-600"}`}
              >
                No public rooms right now.
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2 lg:hidden" role="list">
                {activePublicRooms.map((room) => {
                  const bet = room.betAmount ?? 0;
                  const insufficient =
                    bet > 0 &&
                    userCoins !== null &&
                    userCoins !== undefined &&
                    bet > userCoins;
                  const canClick =
                    room.canJoin !== false && !insufficient;
                  const title =
                    room.name?.trim() || `${room.hostName}'s room`;
                  return (
                    <li
                      key={room.id}
                      className={`rounded border p-3 ${
                        isDark
                          ? "border-zinc-700 bg-zinc-900/35"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold leading-snug sm:text-base ${isDark ? "text-stone-100" : "text-gray-900"}`}
                          >
                            {title}
                          </div>
                          <div
                            className={`mt-0.5 break-all font-mono text-[10px] leading-tight ${isDark ? "text-stone-500" : "text-gray-500"}`}
                          >
                            {room.id}
                          </div>
                          <div
                            className={`mt-1 text-xs ${isDark ? "text-stone-400" : "text-gray-600"}`}
                          >
                            Host: {room.hostName}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span
                            className={`text-xs tabular-nums ${isDark ? "text-stone-300" : "text-gray-700"}`}
                          >
                            Bet: {bet > 0 ? bet : "—"}
                          </span>
                          {getStatusBadge(room.status)}
                          <span
                            className={`text-xs tabular-nums ${isDark ? "text-stone-300" : "text-gray-700"}`}
                          >
                            {room.playerCount}/4
                          </span>
                          <button
                            type="button"
                            onClick={() => handleJoinPublic(room)}
                            disabled={!canClick}
                            className={`ml-auto min-h-[40px] min-w-[5.5rem] rounded px-4 text-sm font-bold transition-all active:scale-[0.98] ${
                              !canClick
                                ? "cursor-not-allowed bg-zinc-600 text-zinc-400"
                                : room.status === "playing"
                                  ? "bg-blue-600 text-white hover:bg-blue-500"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            {insufficient
                              ? "Need coins"
                              : room.canJoin === false
                                ? "Full"
                                : "Join"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div
                className={`hidden overflow-x-auto rounded-md border lg:block ${
                  isDark ? "border-zinc-700" : "border-gray-200"
                }`}
              >
                <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
                  <thead>
                    <tr
                      className={`border-b text-left text-xs font-semibold uppercase tracking-wide ${
                        isDark
                          ? "border-zinc-700 bg-zinc-900/50 text-stone-400"
                          : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      <th className="px-3 py-2.5 md:px-4 md:py-3">Room</th>
                      <th className="w-20 px-2 py-2.5 md:w-24 md:py-3">Bet</th>
                      <th className="w-24 px-2 py-2.5 md:w-28 md:py-3">
                        Status
                      </th>
                      <th className="w-16 px-2 py-2.5 text-center md:w-20 md:py-3">
                        Players
                      </th>
                      <th className="w-24 px-3 py-2.5 text-right md:w-28 md:px-4 md:py-3">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePublicRooms.map((room) => {
                      const bet = room.betAmount ?? 0;
                      const insufficient =
                        bet > 0 &&
                        userCoins !== null &&
                        userCoins !== undefined &&
                        bet > userCoins;
                      const canClick =
                        room.canJoin !== false && !insufficient;
                      return (
                        <tr
                          key={room.id}
                          className={`border-b last:border-0 ${
                            isDark
                              ? "border-zinc-700/80 hover:bg-zinc-900/40"
                              : "border-gray-100 hover:bg-white"
                          }`}
                        >
                          <td className="px-3 py-2.5 align-middle md:px-4 md:py-3">
                            <div
                              className={`font-semibold ${isDark ? "text-stone-100" : "text-gray-900"}`}
                            >
                              {room.name?.trim() || `${room.hostName}'s room`}
                            </div>
                            <div
                              className={`mt-0.5 font-mono text-xs ${isDark ? "text-stone-500" : "text-gray-500"}`}
                            >
                              {room.id}
                            </div>
                            <div
                              className={`mt-0.5 text-xs ${isDark ? "text-stone-400" : "text-gray-600"}`}
                            >
                              Host: {room.hostName}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 align-middle tabular-nums md:py-3">
                            {bet > 0 ? `${bet}` : "—"}
                          </td>
                          <td className="px-2 py-2.5 align-middle md:py-3">
                            {getStatusBadge(room.status)}
                          </td>
                          <td className="px-2 py-2.5 text-center align-middle tabular-nums md:py-3">
                            {room.playerCount}/4
                          </td>
                          <td className="px-3 py-2.5 text-right align-middle md:px-4 md:py-3">
                            <button
                              type="button"
                              onClick={() => handleJoinPublic(room)}
                              disabled={!canClick}
                              className={`rounded px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 md:px-4 md:py-2 md:text-sm ${
                                !canClick
                                  ? "cursor-not-allowed bg-zinc-600 text-zinc-400"
                                  : room.status === "playing"
                                    ? "bg-blue-600 text-white hover:bg-blue-500"
                                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                              }`}
                            >
                              {insufficient
                                ? "Need coins"
                                : room.canJoin === false
                                  ? "Full"
                                  : "Join"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div
            className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 p-6 shadow-2xl ${
              isDark
                ? "border-zinc-600 bg-zinc-900"
                : "border-gray-200 bg-white"
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id="create-room-title"
              className={`mb-1 font-serif text-2xl font-bold ${isDark ? "text-stone-100" : "text-gray-900"}`}
            >
              New room
            </h2>
            <p
              className={`mb-4 text-sm ${isDark ? "text-stone-400" : "text-gray-600"}`}
            >
              Max bet per player cannot exceed your balance
              {userCoins !== null && userCoins !== undefined
                ? ` (${userCoins} coins).`
                : "."}
            </p>

            <div className="flex items-center justify-between gap-3">
              <span
                className={`font-semibold ${isDark ? "text-stone-300" : "text-gray-700"}`}
              >
                {isPublic ? "Public" : "Private"}
              </span>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  isPublic
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </button>
            </div>

            <div className="mt-4">
              <label
                className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-500"}`}
              >
                Room name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Optional — auto-generated if empty"
                maxLength={64}
                disabled={isConnecting}
                className={`mt-2 w-full rounded-xl border-2 px-4 py-3 font-sans text-lg shadow-inner outline-none transition-all disabled:opacity-50 ${
                  isDark
                    ? "border-zinc-700 bg-zinc-950 text-white focus:border-sky-500"
                    : "border-gray-300 bg-white text-gray-900 focus:border-sky-500"
                }`}
              />
            </div>

            <div className="mt-4">
              <label
                className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-stone-400" : "text-gray-500"}`}
              >
                Bet per player (coins)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={
                  userCoins !== null && userCoins !== undefined
                    ? userCoins
                    : undefined
                }
                step={1}
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isConnecting}
                className={`mt-2 w-full rounded-xl border-2 px-4 py-3 font-sans text-lg shadow-inner outline-none transition-all disabled:opacity-50 ${
                  isDark
                    ? "border-zinc-700 bg-zinc-950 text-white focus:border-amber-500"
                    : "border-gray-300 bg-white text-gray-900 focus:border-amber-500"
                }`}
              />
              <div
                className={`mt-2 text-xs ${isDark ? "text-stone-300" : "text-gray-600"}`}
              >
                {normalizedBetAmount > 0
                  ? `Each player stakes ${normalizedBetAmount} coins when the match starts.`
                  : "Free play — no coin stake."}
              </div>
              {createModalError && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    isDark ? "text-red-400" : "text-red-600"
                  }`}
                  role="alert"
                >
                  {createModalError}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${
                  isDark
                    ? "border border-zinc-600 bg-zinc-800 text-stone-200 hover:bg-zinc-700"
                    : "border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isConnecting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-sans text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating…</span>
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
