import { useCallback, useEffect, useMemo, useState } from 'react';
import { socket } from '../network/socket';
import { GameState, GemColor } from '../game/models';

type Toast = { message: string; type: 'error' | 'success' };

export type OnlineGameAction =
  | { type: 'TAKE_TOKENS'; payload: { tokens: GemColor[] } }
  | { type: 'PURCHASE_CARD'; payload: { cardId: string } }
  | { type: 'RESERVE_CARD'; payload: { cardId: string } }
  | { type: 'RESERVE_FROM_DECK'; payload: { level: 1 | 2 | 3 } }
  | { type: 'DISCARD_TOKENS'; payload: { tokens: GemColor[] } }
  | { type: 'CHOOSE_NOBLE'; payload: { nobleId: string } };

type UseOnlineGameArgs = {
  authToken: string | null;
  localPlayerName: string;
  onLocalPlayerName: (name: string) => void;
  onToast: (toast: Toast) => void;
};

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

  const showError = useCallback(
    (message: string) => onToast({ message, type: 'error' }),
    [onToast],
  );

  const setupSocketConnection = useCallback(
    (displayName?: string) => {
      const usernameForSocket = displayName || localPlayerName || undefined;
      socket.auth = { token: authToken ?? 'guest_mode', username: usernameForSocket };
      if (!socket.connected) socket.connect();
    },
    [authToken, localPlayerName],
  );

  useEffect(() => {
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
        (room.players || []).map(
          (p: any, index: number) => p.username || `Player ${index + 1}`,
        ),
      );
      setRoomCode((prev) => prev ?? room.id);
    };

    const handleGameUpdated = (payload: { gameState: GameState }) => {
      setGameState(payload.gameState);
    };

    const handleGameStarted = (payload: { gameState: GameState }) => {
      setGameState(payload.gameState);
    };

    const handleGameError = (data: { message: string }) => {
      showError(data.message);
    };

    socket.on('room:created', handleRoomCreated);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('game:updated', handleGameUpdated);
    socket.on('game:started', handleGameStarted);
    socket.on('game:error', handleGameError);

    return () => {
      socket.off('room:created', handleRoomCreated);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('game:updated', handleGameUpdated);
      socket.off('game:started', handleGameStarted);
      socket.off('game:error', handleGameError);
    };
  }, [showError]);

  const createRoom = useCallback(
    (nameFromSetup: string) => {
      const finalName = localPlayerName || nameFromSetup;
      onLocalPlayerName(finalName);
      setupSocketConnection(finalName);
      socket.emit('room:create');
    },
    [localPlayerName, onLocalPlayerName, setupSocketConnection],
  );

  const joinRoom = useCallback(
    (nameFromSetup: string, code: string) => {
      const finalName = localPlayerName || nameFromSetup;
      onLocalPlayerName(finalName);
      setupSocketConnection(finalName);
      socket.emit('room:join', code.toUpperCase());
    },
    [localPlayerName, onLocalPlayerName, setupSocketConnection],
  );

  const leaveRoom = useCallback(() => {
    if (roomCode) socket.emit('leaveRoom', { roomCode });
    setRoomCode(null);
    setLobbyPlayers([]);
    setIsHost(false);
    setGameState(null);
  }, [roomCode]);

  const startGame = useCallback(() => {
    if (roomCode) socket.emit('room:start', roomCode);
  }, [roomCode]);

  const restartGame = useCallback(() => {
    if (roomCode) socket.emit('restartGame', { roomCode });
  }, [roomCode]);

  const sendAction = useCallback(
    (action: OnlineGameAction) => {
      if (!gameState || !roomCode) return;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.name !== localPlayerName) {
        showError("It's not your turn!");
        return;
      }

      switch (action.type) {
        case 'TAKE_TOKENS':
          socket.emit('game:takeTokens', roomCode, action.payload.tokens);
          break;
        case 'PURCHASE_CARD':
          socket.emit('game:purchaseCard', roomCode, action.payload.cardId);
          break;
        case 'RESERVE_CARD':
          socket.emit('game:reserveCard', roomCode, action.payload.cardId);
          break;
        case 'RESERVE_FROM_DECK':
          socket.emit('game:reserveFromDeck', roomCode, action.payload.level);
          break;
        case 'DISCARD_TOKENS':
          socket.emit('game:discardTokens', roomCode, action.payload.tokens);
          break;
        case 'CHOOSE_NOBLE':
          socket.emit('game:chooseNoble', roomCode, action.payload.nobleId);
          break;
        default:
          break;
      }
    },
    [gameState, localPlayerName, roomCode, showError],
  );

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
      sendAction,
    }),
    [createRoom, joinRoom, leaveRoom, startGame, restartGame, sendAction],
  );

  return { room, gameState, actions };
}

