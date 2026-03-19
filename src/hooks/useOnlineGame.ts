import { useCallback, useEffect, useMemo, useState } from "react";
import { socket } from "../network/socket";
import { GameState, GemColor } from "../game/models";

type Toast = { message: string; type: "error" | "success" };

export type OnlineGameAction =
  | {
      type: "TAKE_TOKENS";
      payload: { tokens: GemColor[]; discardTokens?: GemColor[] };
    }
  | { type: "PURCHASE_CARD"; payload: { cardId: string } }
  | {
      type: "RESERVE_CARD";
      payload: { cardId: string; discardTokens?: GemColor[] };
    }
  | {
      type: "RESERVE_FROM_DECK";
      payload: { level: 1 | 2 | 3; discardTokens?: GemColor[] };
    }
  | { type: "DISCARD_TOKENS"; payload: { tokens: GemColor[] } }
  | { type: "CHOOSE_NOBLE"; payload: { nobleId: string } };

type UseOnlineGameArgs = {
  authToken: string | null;
  localPlayerName: string;
  onLocalPlayerName: (name: string) => void;
  onToast: (toast: Toast) => void;
};

const RECONNECT_ROOM_STORAGE_KEY = "splendor:reconnectRoom";

export function useOnlineGame({
  authToken,
  localPlayerName,
  onLocalPlayerName,
  onToast,
}: UseOnlineGameArgs) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rematchState, setRematchState] = useState<{
    enabled: boolean;
    requestedBy: string[];
    totalPlayers: number;
    message?: string;
  } | null>(null);

  // تغییر برای پشتیبانی از دیسکانکت‌های همزمان چند کاربر
  const [pendingDisconnects, setPendingDisconnects] = useState<
    Record<string, { username: string; expiresAt: number; isHost?: boolean }>
  >({});

  const [publicRooms, setPublicRooms] = useState<
    Array<{
      id: string;
      hostName: string;
      playerCount: number;
      status?: string;
      canJoin?: boolean;
    }>
  >([]);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);

  const showError = useCallback(
    (message: string) => onToast({ message, type: "error" }),
    [onToast],
  );

  const setupSocketConnection = useCallback(
    (displayName?: string) => {
      const usernameForSocket = displayName || localPlayerName || undefined;
      socket.auth = {
        token: authToken ?? "guest_mode",
        username: usernameForSocket,
      };
      if (!socket.connected) socket.connect();
    },
    [authToken, localPlayerName],
  );

  // Ensure we connect (with fresh auth) right after login so backend can restore session.
  useEffect(() => {
    if (!authToken) return;
    setupSocketConnection();
  }, [authToken, setupSocketConnection]);

  // Helper to clear stored session data
  const clearStoredSession = useCallback(() => {
    window.localStorage.removeItem(RECONNECT_ROOM_STORAGE_KEY);
  }, []);

  useEffect(() => {
    // رویداد اتصال مجدد خودکار (بدون رفرش صفحه)
    const handleSocketConnect = () => {
      setRoomCode((currentCode) => {
        if (currentCode) {
          console.log("[Frontend] Auto-reconnect triggered in background for room:", currentCode);
          socket.emit("room:reconnect", currentCode);
        } else if (authToken) {
          // If client doesn't know the room (e.g. after logout/login or on new device),
          // ask backend to restore the latest session for this userId.
          socket.emit("room:getSession");
        }
        return currentCode;
      });
    };

    const handleRoomCreated = (data: { roomId: string; room: any }) => {
      setRoomCode(data.roomId);
      setIsHost(true);
      setLobbyPlayers(
        (data.room.players || []).map(
          (p: any, index: number) => p.username || `Player ${index + 1}`,
        ),
      );
    };

    const handleRoomUpdated = (data: { room: any }) => {
      const room = data.room;
      if (!room) return;

      setLobbyPlayers(
        (room.players || []).map((p: any, index: number) => {
          const base = p.username || `Player ${index + 1}`;
          return p.socketId ? base : `${base} (disconnected)`;
        }),
      );
      setRoomCode((prev) => prev ?? room.id);
    };

    const handleGameUpdated = (payload: { gameState: GameState }) => {
      console.log("[Frontend] Game updated:", payload.gameState);
      setGameState(payload.gameState);
    };

    const handleGameStarted = (payload: { gameState: GameState }) => {
      setGameState(payload.gameState);
      setRematchState(null);
    };

    const handleGameError = (data: { message: string }) => {
      showError(data.message);
    };

    const handleSocketError = (data: { message?: string } | any) => {
      const message =
        typeof data?.message === "string" ? data.message : "Connection error";
      // Common recoverable cases: session expired, room not found, not in room.
      if (
        /room not found/i.test(message) ||
        /not in this room/i.test(message) ||
        /session/i.test(message)
      ) {
        showError(message);
        leaveRoom(false, { clearStoredSession: true });
        return;
      }
      showError(message);
    };

    const handleGameEnded = () => {
      // Game ended unexpectedly (server-side termination). Return to Setup and clear session.
      leaveRoom(false, { clearStoredSession: true });
    };

    const handlePlayerDisconnected = (data: {
      userId: string;
      username: string;
      timeoutMs: number;
      expiresAt?: number;
      isHost?: boolean;
    }) => {
      setPendingDisconnects((prev) => ({
        ...prev,
        [data.userId]: {
          username: data.username,
          expiresAt: data.expiresAt ?? Date.now() + data.timeoutMs,
          isHost: data.isHost || false,
        },
      }));

      if (data.isHost) {
        showError(
          `${data.username} (Host) disconnected. Waiting for reconnection...`,
        );
      } else {
        showError(`${data.username} disconnected. Waiting for reconnection...`);
      }
    };

    const handlePlayerReconnected = (data: {
      userId: string;
      username: string;
    }) => {
      setPendingDisconnects((prev) => {
        const newState = { ...prev };
        delete newState[data.userId];
        return newState;
      });
      onToast({ message: `${data.username} reconnected.`, type: "success" });
    };

    const handlePlayerTimeout = (data: { userId: string; username: string }) => {
      showError(`${data.username} did not reconnect in time.`);
      // After timeout, room/game are no longer valid for the disconnected user.
      leaveRoom(false, { clearStoredSession: true });
    };

    const handleDisconnectStatus = (data: {
      pending: Array<{
        userId: string;
        username: string;
        expiresAt: number;
        isHost?: boolean;
      }>;
    }) => {
      const next: Record<
        string,
        { username: string; expiresAt: number; isHost?: boolean }
      > = {};
      for (const p of data.pending || []) {
        next[p.userId] = {
          username: p.username,
          expiresAt: p.expiresAt,
          isHost: p.isHost || false,
        };
      }
      setPendingDisconnects(next);
    };

    const handleSessionRestored = (data: { roomId: string }) => {
      if (!data?.roomId) return;
      setRoomCode((prev) => prev ?? data.roomId);
      socket.emit("room:reconnect", data.roomId);
    };

    const handleSessionCleared = () => {
      leaveRoom(false, { clearStoredSession: true });
    };

    const handleRoomTerminated = (data: {
      reason: string;
      message: string;
    }) => {
      showError(data.message);
      leaveRoom(false);
    };

    const handleRematchUpdate = (data: {
      enabled: boolean;
      requestedBy: string[];
      totalPlayers: number;
      message?: string;
    }) => {
      setRematchState(data);
      if (data.message) {
        showError(data.message);
      }
    };

    const handlePublicRoomsList = (
      rooms: Array<{
        id: string;
        hostName: string;
        playerCount: number;
        status?: string;
        canJoin?: boolean;
      }>,
    ) => {
      setPublicRooms(rooms);
      setIsLoadingPublicRooms(false);
    };

    socket.on("connect", handleSocketConnect);
    socket.on("room:created", handleRoomCreated);
    socket.on("room:updated", handleRoomUpdated);
    socket.on("room:publicList", handlePublicRoomsList);
    socket.on("room:terminated", handleRoomTerminated);
    socket.on("room:disconnectStatus", handleDisconnectStatus);
    socket.on("room:sessionRestored", handleSessionRestored);
    socket.on("room:sessionCleared", handleSessionCleared);
    socket.on("player:disconnected", handlePlayerDisconnected);
    socket.on("player:reconnected", handlePlayerReconnected);
    socket.on("player:timeout", handlePlayerTimeout);
    socket.on("error", handleSocketError);
    socket.on("game:updated", handleGameUpdated);
    socket.on("game:started", handleGameStarted);
    socket.on("game:error", handleGameError);
    socket.on("game:ended", handleGameEnded);
    socket.on("game:rematch:update", handleRematchUpdate);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("room:created", handleRoomCreated);
      socket.off("room:updated", handleRoomUpdated);
      socket.off("room:publicList", handlePublicRoomsList);
      socket.off("room:terminated", handleRoomTerminated);
      socket.off("room:disconnectStatus", handleDisconnectStatus);
      socket.off("room:sessionRestored", handleSessionRestored);
      socket.off("room:sessionCleared", handleSessionCleared);
      socket.off("player:disconnected", handlePlayerDisconnected);
      socket.off("player:reconnected", handlePlayerReconnected);
      socket.off("player:timeout", handlePlayerTimeout);
      socket.off("error", handleSocketError);
      socket.off("game:updated", handleGameUpdated);
      socket.off("game:started", handleGameStarted);
      socket.off("game:error", handleGameError);
      socket.off("game:ended", handleGameEnded);
      socket.off("game:rematch:update", handleRematchUpdate);
    };
  }, [authToken, showError, onToast]);

  const createRoom = useCallback(
    (nameFromSetup: string, isPublic: boolean = false) => {
      const finalName = localPlayerName || nameFromSetup;
      onLocalPlayerName(finalName);
      setupSocketConnection(finalName);
      socket.emit("room:create", isPublic);
    },
    [localPlayerName, onLocalPlayerName, setupSocketConnection],
  );

  const joinRoom = useCallback(
    (nameFromSetup: string, code: string) => {
      const finalName = localPlayerName || nameFromSetup;
      onLocalPlayerName(finalName);
      setupSocketConnection(finalName);
      socket.emit("room:join", code.toUpperCase());
    },
    [localPlayerName, onLocalPlayerName, setupSocketConnection],
  );

  const leaveRoom = useCallback(
    (
      emit: boolean = true,
      options?: {
        clearStoredSession?: boolean;
      },
    ) => {
      if (roomCode && emit) {
        socket.emit("leaveRoom", { roomCode });
      }
      if (options?.clearStoredSession !== false) {
        clearStoredSession();
      }
      setRoomCode(null);
      setLobbyPlayers([]);
      setIsHost(false);
      setGameState(null);
      setRematchState(null);
      setPendingDisconnects({}); // Clear all
    },
    [roomCode, clearStoredSession],
  );

  const startGame = useCallback(() => {
    if (roomCode) socket.emit("room:start", roomCode);
  }, [roomCode]);

  const requestRematch = useCallback(() => {
    if (roomCode) socket.emit("game:rematch:request", roomCode);
  }, [roomCode]);

  const listPublicRooms = useCallback(() => {
    if (!socket.connected) {
      setupSocketConnection();
    }
    setIsLoadingPublicRooms(true);
    socket.emit("room:listPublic");
  }, [setupSocketConnection]);

  const reconnectToRoom = useCallback((attemptRoomCode: string) => {
    socket.emit("room:reconnect", attemptRoomCode);
  }, []);

  const restartGame = useCallback(() => {
    requestRematch();
  }, [requestRematch]);

  const sendAction = useCallback(
    (action: OnlineGameAction) => {
      if (!gameState || !roomCode) return;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.name !== localPlayerName) {
        showError("It's not your turn!");
        return;
      }

      switch (action.type) {
        case "TAKE_TOKENS":
          socket.emit(
            "game:takeTokens",
            roomCode,
            action.payload.tokens,
            action.payload.discardTokens ?? [],
          );
          break;
        case "PURCHASE_CARD":
          socket.emit("game:purchaseCard", roomCode, action.payload.cardId);
          break;
        case "RESERVE_CARD":
          socket.emit(
            "game:reserveCard",
            roomCode,
            action.payload.cardId,
            action.payload.discardTokens ?? [],
          );
          break;
        case "RESERVE_FROM_DECK":
          socket.emit(
            "game:reserveFromDeck",
            roomCode,
            action.payload.level,
            action.payload.discardTokens ?? [],
          );
          break;
        case "DISCARD_TOKENS":
          socket.emit("game:discardTokens", roomCode, action.payload.tokens);
          break;
        case "CHOOSE_NOBLE":
          socket.emit("game:chooseNoble", roomCode, action.payload.nobleId);
          break;
        default:
          break;
      }
    },
    [gameState, localPlayerName, roomCode, showError],
  );

  useEffect(() => {
    if (roomCode) {
      window.localStorage.setItem(RECONNECT_ROOM_STORAGE_KEY, roomCode);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!authToken) return;

    const storedRoomCode = window.localStorage.getItem(
      RECONNECT_ROOM_STORAGE_KEY,
    );
    if (storedRoomCode && !roomCode) {
      console.log(
        "[Frontend] Attempting auto-reconnect to room:",
        storedRoomCode,
      );
      setupSocketConnection();
      
      const onConnect = () => {
        console.log("[Frontend] Socket connected, emitting room:reconnect");
        socket.emit("room:reconnect", storedRoomCode);
        socket.off("connect", onConnect);
      };
      if (socket.connected) {
        console.log(
          "[Frontend] Socket already connected, emitting room:reconnect",
        );
        socket.emit("room:reconnect", storedRoomCode);
      } else {
        console.log(
          "[Frontend] Socket not connected, waiting for connect event",
        );
        socket.on("connect", onConnect);
      }
    } else {
      console.log("[Frontend] No stored room code or already in room:", {
        storedRoomCode,
        roomCode,
      });
    }
  }, [authToken, roomCode, setupSocketConnection]);

  const room = useMemo(
    () => ({ roomCode, lobbyPlayers, isHost }),
    [roomCode, lobbyPlayers, isHost],
  );

  const actions = useMemo(
    () => ({
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      restartGame,
      requestRematch,
      listPublicRooms,
      reconnectToRoom,
      sendAction,
    }),
    [
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      restartGame,
      requestRematch,
      listPublicRooms,
      reconnectToRoom,
      sendAction,
    ],
  );

  const pendingDisconnectArray = Object.values(pendingDisconnects);
  const legacyPendingDisconnect =
    pendingDisconnectArray.length > 0 ? pendingDisconnectArray[0] : null;

  return {
    room,
    gameState,
    rematchState,
    pendingDisconnect: legacyPendingDisconnect,
    pendingDisconnects: pendingDisconnectArray,
    publicRooms,
    isLoadingPublicRooms,
    actions,
  };
}
