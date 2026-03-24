import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameSoundId } from "../audio/gameAudio";
import type { TokenFlightItem } from "../components/TokenFlightOverlay";
import { socket } from "../network/socket";
import { GameState, GemColor } from "../game/models";
import {
  applyOptimisticBankReceiveDiscard,
  applyOptimisticDiscardLeavePlayer,
  applyOptimisticTakeOnly,
} from "../utils/optimisticGameState";
import {
  buildDiscardTokenFlights,
  buildTakeTokenFlights,
  tokenFlightTotalMs,
} from "../utils/tokenFlight";
import {
  buildCardFlightVisual,
  type CardFlightVisual,
  type CardMovedSocketPayload,
} from "../utils/cardFlight";
import { CARD_FLIGHT_DURATION_MS } from "../components/CardFlightOverlay";
import { BOARD_REFILL_DURATION_MS } from "../components/BoardRefillFlightOverlay";

type Toast = { message: string; type: "error" | "success" };

export type PublicRoomRow = {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  status?: string;
  canJoin?: boolean;
  betAmount?: number;
  isPublic?: boolean;
};

type SocketRoomPlayer = {
  userId: string;
  socketId: string | null;
  username: string;
};

type SocketRoomSnapshot = {
  id: string;
  players: SocketRoomPlayer[];
  name?: string;
};

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
  onPlaySound?: (sound: GameSoundId) => void;
};

const RECONNECT_ROOM_STORAGE_KEY = "splendor:reconnectRoom";

export function useOnlineGame({
  authToken,
  localPlayerName,
  onLocalPlayerName,
  onToast,
  onPlaySound,
}: UseOnlineGameArgs) {
  const playRef = useRef(onPlaySound);
  playRef.current = onPlaySound;

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{
    reason?: string;
    winner?: any;
    winnerStats?: {
      coins: number;
      winRate: number;
      xp?: number;
      wins?: number;
      losses?: number;
    } | null;
    loserStats?: Array<{
      userId: string;
      coinsLost: number;
      coins: number;
      xp: number;
      wins: number;
      losses: number;
      winRate: number;
    }>;
    finalState?: any;
  } | null>(null);
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

  const [publicRooms, setPublicRooms] = useState<PublicRoomRow[]>([]);
  const [isLoadingPublicRooms, setIsLoadingPublicRooms] = useState(false);

  const [tokenFlightVisual, setTokenFlightVisual] = useState<{
    items: TokenFlightItem[];
    sizePx: number;
  } | null>(null);
  const tokenFlightTimerRef = useRef<number | null>(null);

  const [cardFlightVisual, setCardFlightVisual] =
    useState<CardFlightVisual | null>(null);
  const cardFlightTimerRef = useRef<number | null>(null);
  /** Direct DOM ref to hide source card immediately (no React cycle delay). */
  const hiddenSourceElRef = useRef<HTMLElement | null>(null);

  /**
   * True from when a card starts flying until the board-refill animation finishes.
   * Used to block interactions and delay the "your turn" audio cue.
   */
  const [boardAnimating, setBoardAnimating] = useState(false);
  const boardAnimTimerRef = useRef<number | null>(null);
  /** Set to true in handleCardMoved, cleared in handleGameUpdated after refill. */
  const cardMoveInFlightRef = useRef(false);
  /** Always holds the latest game state for synchronous reads inside event handlers. */
  const latestGameStateRef = useRef<GameState | null>(null);

  const clearTokenFlightTimer = useCallback(() => {
    if (tokenFlightTimerRef.current != null) {
      window.clearTimeout(tokenFlightTimerRef.current);
      tokenFlightTimerRef.current = null;
    }
  }, []);

  const clearCardFlightTimer = useCallback(() => {
    if (cardFlightTimerRef.current != null) {
      window.clearTimeout(cardFlightTimerRef.current);
      cardFlightTimerRef.current = null;
    }
  }, []);

  const showError = useCallback(
    (message: string) => onToast({ message, type: "error" }),
    [onToast],
  );

  const showSuccess = useCallback(
    (message: string) => onToast({ message, type: "success" }),
    [onToast],
  );

  const publicListLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
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

    const handleRoomCreated = (data: {
      roomId: string;
      room: SocketRoomSnapshot;
    }) => {
      setRoomCode(data.roomId);
      setIsHost(true);
      setLobbyPlayers(
        (data.room.players || []).map(
          (p, index: number) => p.username || `Player ${index + 1}`,
        ),
      );
      showSuccess("Room created. Share the code with other players.");
    };

    const handleRoomUpdated = (data: { room: SocketRoomSnapshot | null }) => {
      const room = data.room;
      if (!room) return;

      setLobbyPlayers(
        (room.players || []).map((p, index: number) => {
          const base = p.username || `Player ${index + 1}`;
          return p.socketId ? base : `${base} (disconnected)`;
        }),
      );
      setRoomCode((prev) => prev ?? room.id);
    };

    const handleTokensTaken = (payload: {
      playerId?: string;
      tokens?: GemColor[];
      discardTokens?: GemColor[];
    }) => {
      if (typeof document === "undefined") return;
      const playerId = payload?.playerId;
      if (!playerId) return;
      const take = payload?.tokens ?? [];
      const discard = payload?.discardTokens ?? [];
      if (take.length === 0 && discard.length === 0) return;

      const sizePx = window.matchMedia("(min-width: 640px)").matches
        ? 52
        : 36;

      const runDiscardFlight = () => {
        if (discard.length === 0) {
          tokenFlightTimerRef.current = null;
          return;
        }
        const dItems = buildDiscardTokenFlights(discard, playerId);
        if (!dItems?.length) {
          tokenFlightTimerRef.current = null;
          return;
        }
        setGameState((prev) =>
          prev ? applyOptimisticDiscardLeavePlayer(prev, playerId, discard) : prev,
        );
        setTokenFlightVisual({ items: dItems, sizePx });
        tokenFlightTimerRef.current = window.setTimeout(() => {
          setTokenFlightVisual(null);
          tokenFlightTimerRef.current = null;
          setGameState((prev) =>
            prev ? applyOptimisticBankReceiveDiscard(prev, discard) : prev,
          );
        }, tokenFlightTotalMs(discard.length));
      };

      clearTokenFlightTimer();

      if (take.length > 0) {
        const takeItems = buildTakeTokenFlights(take, playerId);
        if (!takeItems?.length) {
          runDiscardFlight();
          return;
        }
        setGameState((prev) =>
          prev ? applyOptimisticTakeOnly(prev, playerId, take) : prev,
        );
        setTokenFlightVisual({ items: takeItems, sizePx });
        tokenFlightTimerRef.current = window.setTimeout(() => {
          tokenFlightTimerRef.current = null;
          setTokenFlightVisual(null);
          runDiscardFlight();
        }, tokenFlightTotalMs(take.length));
      } else {
        runDiscardFlight();
      }
    };

    const handleTokensDiscarded = (payload: {
      playerId?: string;
      tokens?: GemColor[];
    }) => {
      if (typeof document === "undefined") return;
      const playerId = payload?.playerId;
      const tokens = payload?.tokens;
      if (!playerId || !Array.isArray(tokens) || tokens.length === 0) return;
      const items = buildDiscardTokenFlights(tokens, playerId);
      if (!items?.length) return;
      const sizePx = window.matchMedia("(min-width: 640px)").matches
        ? 52
        : 36;
      clearTokenFlightTimer();
      setGameState((prev) =>
        prev ? applyOptimisticDiscardLeavePlayer(prev, playerId, tokens) : prev,
      );
      setTokenFlightVisual({ items, sizePx });
      tokenFlightTimerRef.current = window.setTimeout(() => {
        setTokenFlightVisual(null);
        tokenFlightTimerRef.current = null;
        setGameState((prev) =>
          prev ? applyOptimisticBankReceiveDiscard(prev, tokens) : prev,
        );
      }, tokenFlightTotalMs(items.length));
    };

    const handleCardMoved = (payload: CardMovedSocketPayload) => {
      if (typeof document === "undefined") return;
      cardMoveInFlightRef.current = true;
      setBoardAnimating(true);

      // Immediately hide source in the DOM — before React has a chance to paint —
      // so the flying overlay is the only visible copy (no duplicate/ghost).
      if (payload.source === "board") {
        const el = document.querySelector<HTMLElement>(
          `[data-board-card="${payload.cardId}"]`,
        );
        if (el) {
          el.style.visibility = "hidden";
          hiddenSourceElRef.current = el;
        }
      } else if (payload.source === "reserved") {
        const el = document.querySelector<HTMLElement>(
          `[data-reserved-card="${payload.cardId}"]`,
        );
        if (el) {
          el.style.visibility = "hidden";
          hiddenSourceElRef.current = el;
        }
      }

      const v = buildCardFlightVisual(payload);
      if (!v) {
        // Restore if we can't build the flight (shouldn't happen but be safe)
        if (hiddenSourceElRef.current) {
          hiddenSourceElRef.current.style.visibility = "";
          hiddenSourceElRef.current = null;
        }
        return;
      }
      clearCardFlightTimer();
      setCardFlightVisual(v);
      // Fallback if game:updated is lost; server uses ~CARD_MOVE_MS+120 after cardMoved.
      cardFlightTimerRef.current = window.setTimeout(() => {
        setCardFlightVisual(null);
        cardFlightTimerRef.current = null;
        if (hiddenSourceElRef.current) {
          hiddenSourceElRef.current.style.visibility = "";
          hiddenSourceElRef.current = null;
        }
      }, CARD_FLIGHT_DURATION_MS + 800);
    };

    const handleGameUpdated = (payload: { gameState: GameState }) => {
      clearCardFlightTimer();
      setCardFlightVisual(null);
      if (hiddenSourceElRef.current) {
        hiddenSourceElRef.current.style.visibility = "";
        hiddenSourceElRef.current = null;
      }

      const next = payload.gameState;
      const wasCardMove = cardMoveInFlightRef.current;
      cardMoveInFlightRef.current = false;

      // Detect turn change synchronously before applying the new state
      const prev = latestGameStateRef.current;
      const isMyTurn =
        prev != null &&
        localPlayerName != null &&
        prev.currentPlayerIndex !== next.currentPlayerIndex &&
        next.players[next.currentPlayerIndex]?.name === localPlayerName &&
        !next.winner;

      setGameState(next);

      if (wasCardMove) {
        // Unlock board and fire "your turn" sound only after refill animation completes
        if (boardAnimTimerRef.current != null) {
          window.clearTimeout(boardAnimTimerRef.current);
        }
        boardAnimTimerRef.current = window.setTimeout(() => {
          setBoardAnimating(false);
          boardAnimTimerRef.current = null;
          if (isMyTurn) playRef.current?.("yourTurn");
        }, BOARD_REFILL_DURATION_MS + 200);
      } else {
        setBoardAnimating(false);
        if (isMyTurn) queueMicrotask(() => playRef.current?.("yourTurn"));
      }
    };

    const handleGameStarted = (payload: { gameState: GameState }) => {
      playRef.current?.("gameStart");
      setGameState(payload.gameState);
      setRematchState(null);
      setGameOverInfo(null);
    };

    const handleGameError = (data: { message?: string }) => {
      showError(data?.message ?? "Game error.");
    };

    const handleSocketError = (data: { message?: string } | string | unknown) => {
      const message =
        typeof data === "string"
          ? data
          : typeof data === "object" && data !== null && "message" in data
            ? String((data as { message?: unknown }).message ?? "")
            : "";
      const finalMessage =
        message.trim().length > 0 ? message : "An unexpected error occurred.";
      // Common recoverable cases: session expired, room not found, not in room.
      if (
        /room not found/i.test(finalMessage) ||
        /not in this room/i.test(finalMessage) ||
        /session/i.test(finalMessage)
      ) {
        showError(finalMessage);
        leaveRoom(false, { clearStoredSession: true });
        return;
      }
      showError(finalMessage);
    };

    const handleGameEnded = () => {
      // Game ended unexpectedly (server-side termination). Return to Setup and clear session.
      setGameOverInfo(null);
      leaveRoom(false, { clearStoredSession: true });
    };

    const handleGameOver = (payload: {
      reason?: string;
      winner?: any;
      winnerStats?: {
        coins: number;
        winRate: number;
        xp?: number;
        wins?: number;
        losses?: number;
      } | null;
      loserStats?: Array<{
        userId: string;
        coinsLost: number;
        coins: number;
        xp: number;
        wins: number;
        losses: number;
        winRate: number;
      }>;
      finalState?: any;
    }) => {
      const w = payload?.winner;
      if (w?.name === localPlayerName) playRef.current?.("win");
      else if (w) playRef.current?.("lose");
      // Apply finalState so gameState.winner is set and GameOverModal renders
      if (payload?.finalState) {
        setGameState(payload.finalState);
      }
      setGameOverInfo(payload ?? null);
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
      // Only the timed-out local user should leave; other players still need the GameOver UI.
      if (data.username !== localPlayerName) return;
      showError(`${data.username} did not reconnect in time.`);
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

    const handleRoomTerminated = (data?: {
      reason?: string;
      message?: string;
    }) => {
      const msg =
        data?.message ?? data?.reason ?? "The room was closed.";
      showError(msg);
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

    const handlePublicRoomsList = (rooms: PublicRoomRow[]) => {
      if (publicListLoadTimeoutRef.current) {
        clearTimeout(publicListLoadTimeoutRef.current);
        publicListLoadTimeoutRef.current = null;
      }
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
    socket.on("game:tokensTaken", handleTokensTaken);
    socket.on("game:tokensDiscarded", handleTokensDiscarded);
    socket.on("game:cardMoved", handleCardMoved);
    socket.on("game:updated", handleGameUpdated);
    socket.on("game:started", handleGameStarted);
    socket.on("game:error", handleGameError);
    socket.on("game:ended", handleGameEnded);
    socket.on("game:over", handleGameOver);
    socket.on("game:rematch:update", handleRematchUpdate);

    return () => {
      if (publicListLoadTimeoutRef.current) {
        clearTimeout(publicListLoadTimeoutRef.current);
        publicListLoadTimeoutRef.current = null;
      }
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
      socket.off("game:tokensTaken", handleTokensTaken);
      socket.off("game:tokensDiscarded", handleTokensDiscarded);
      socket.off("game:cardMoved", handleCardMoved);
      socket.off("game:updated", handleGameUpdated);
      socket.off("game:started", handleGameStarted);
      socket.off("game:error", handleGameError);
      socket.off("game:ended", handleGameEnded);
      socket.off("game:over", handleGameOver);
      socket.off("game:rematch:update", handleRematchUpdate);
    };
  }, [
    authToken,
    showError,
    showSuccess,
    onToast,
    localPlayerName,
    clearTokenFlightTimer,
    clearCardFlightTimer,
  ]);

  const createRoom = useCallback(
    (roomName: string, isPublic: boolean = true, betAmount: number = 0) => {
      setupSocketConnection();
      socket.emit("room:create", {
        isPublic,
        roomName: roomName?.trim() || undefined,
        betAmount,
      });
    },
    [setupSocketConnection],
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
      setGameOverInfo(null);
      setPendingDisconnects({}); // Clear all
      clearTokenFlightTimer();
      clearCardFlightTimer();
      setTokenFlightVisual(null);
      setCardFlightVisual(null);
    },
    [roomCode, clearStoredSession, clearTokenFlightTimer, clearCardFlightTimer],
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
    if (publicListLoadTimeoutRef.current) {
      clearTimeout(publicListLoadTimeoutRef.current);
    }
    setIsLoadingPublicRooms(true);
    publicListLoadTimeoutRef.current = setTimeout(() => {
      publicListLoadTimeoutRef.current = null;
      setIsLoadingPublicRooms((loading) => {
        if (loading) {
          showError(
            "Could not load the public room list. Check your connection.",
          );
        }
        return false;
      });
    }, 12000);
    socket.emit("room:listPublic");
  }, [setupSocketConnection, showError]);

  useEffect(() => {
    const onConnectError = (err: Error) => {
      showError(
        err?.message?.trim()
          ? err.message
          : "Failed to connect to the game server.",
      );
    };
    socket.on("connect_error", onConnectError);
    return () => {
      socket.off("connect_error", onConnectError);
    };
  }, [showError]);

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

  // Keep latestGameStateRef in sync for synchronous reads inside socket handlers
  latestGameStateRef.current = gameState;

  return {
    room,
    gameState,
    gameOverInfo,
    rematchState,
    pendingDisconnect: legacyPendingDisconnect,
    pendingDisconnects: pendingDisconnectArray,
    publicRooms,
    isLoadingPublicRooms,
    tokenFlightVisual,
    cardFlightVisual,
    boardAnimating,
    actions,
  };
}
