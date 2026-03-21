import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GemColor } from './game/models';
import { useOnlineGame } from './hooks/useOnlineGame';
import { useUserProfile } from './hooks/useUserProfile';
import { socket } from './network/socket';

type PendingDiscardAction =
  | { type: 'TAKE_TOKENS'; tokens: GemColor[] }
  | { type: 'RESERVE_CARD'; cardId: string; willReceiveGold: boolean }
  | { type: 'RESERVE_FROM_DECK'; level: 1 | 2 | 3; willReceiveGold: boolean };

import { AuthScreen } from './components/AuthScreen';
import { SetupPage } from './pages/SetupPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { UserProfile } from './components/UserProfile';
import { AppToast, type ToastItem } from './components/AppToast';
import { useGameAudio } from './context/GameAudioContext';

const STORAGE_AUTH_TOKEN = 'splendor:authToken';
const STORAGE_USERNAME = 'splendor:username';

export default function App() {
  const { play } = useGameAudio();

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [localPlayerName, setLocalPlayerName] = useState<string>('');

  // Reconnect State
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [disconnectedRoomCode, setDisconnectedRoomCode] = useState<string | null>(null);
  const [reconnectCountdown, setReconnectCountdown] = useState<number>(120);

  // Restore saved auth + player name if returning to the app
  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_AUTH_TOKEN);
    const storedName = window.localStorage.getItem(STORAGE_USERNAME);
    if (storedToken) {
      setAuthToken(storedToken);
      setIsAuthenticated(true);
    }
    if (storedName) {
      setLocalPlayerName(storedName);
    }
  }, []);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // UI States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showProfilePage, setShowProfilePage] = useState(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: 'error' | 'success' = 'error',
      silentSound = false,
    ) => {
      if (!silentSound) {
        if (type === 'error') play('error');
        if (type === 'success') play('success');
      }
      const id = crypto.randomUUID();
      const item: ToastItem = {
        id,
        message,
        type,
        variant: 'default',
      };
      setToasts((prev) => [...prev, item].slice(-8));
      window.setTimeout(() => dismissToast(id), 6000);
    },
    [play, dismissToast],
  );

  const onChatBackgroundNotify = useCallback(
    (payload: { username: string; text: string }) => {
      const t = payload.text.trim();
      const preview = t.length > 120 ? `${t.slice(0, 120)}…` : t;
      const id = crypto.randomUUID();
      const item: ToastItem = {
        id,
        type: 'success',
        title: `New message from ${payload.username}`,
        message: preview,
        variant: 'chat',
      };
      setToasts((prev) => [...prev, item].slice(-8));
      window.setTimeout(() => dismissToast(id), 6500);
    },
    [dismissToast],
  );

  const onOnlineGameToast = useCallback(
    (payload: { message: string; type: 'error' | 'success' }) => {
      showToast(payload.message, payload.type);
    },
    [showToast],
  );

  const onSetupNotify = useCallback(
    (message: string, type?: 'error' | 'success') => {
      showToast(message, type ?? 'error');
    },
    [showToast],
  );

  const {
    room: { roomCode, lobbyPlayers, isHost },
    gameState,
    gameOverInfo,
    rematchState,
    pendingDisconnect,
    pendingDisconnects,
    publicRooms,
    isLoadingPublicRooms,
    actions,
  } = useOnlineGame({
    authToken,
    localPlayerName,
    onLocalPlayerName: setLocalPlayerName,
    onToast: onOnlineGameToast,
    onPlaySound: play,
  });

  const { profile, fetchProfile } = useUserProfile(authToken);

  const prevRoomCodeRef = useRef<string | null>(null);
  const prevShowProfileRef = useRef(false);

  // After leaving lobby/game, refresh /user/me so setup shows current username, coins, etc.
  useEffect(() => {
    if (!authToken) return;
    const wasInRoom = prevRoomCodeRef.current !== null;
    prevRoomCodeRef.current = roomCode;
    if (wasInRoom && roomCode === null) {
      void fetchProfile();
    }
  }, [authToken, roomCode, fetchProfile]);

  // After closing profile, refresh so setup header reflects saved username, balance, avatar, etc.
  useEffect(() => {
    if (!authToken) return;
    const wasProfile = prevShowProfileRef.current;
    prevShowProfileRef.current = showProfilePage;
    if (wasProfile && !showProfilePage) {
      void fetchProfile();
    }
  }, [authToken, showProfilePage, fetchProfile]);

  // Sync display name with server after guest → member upgrade or profile username change.
  useEffect(() => {
    if (!authToken) return;
    const name = profile?.username?.trim();
    if (!name) return;
    if (profile.is_guest === true || profile.role === 'GUEST') return;

    setLocalPlayerName((prev) => {
      if (prev === name) return prev;
      window.localStorage.setItem(STORAGE_USERNAME, name);
      if (socket.connected) {
        queueMicrotask(() => {
          socket.emit('auth:refresh');
        });
      }
      return name;
    });
  }, [authToken, profile?.username, profile?.is_guest, profile?.role]);

  // Handle socket disconnection and show reconnect modal
  useEffect(() => {
    const handleDisconnect = () => {
      if (roomCode) {
        console.log('[App] Socket disconnected, showing reconnect modal for room:', roomCode);
        setDisconnectedRoomCode(roomCode);
        setShowReconnectModal(true);
        setReconnectCountdown(120);
        showToast('Connection lost. You have 2 minutes to reconnect.', 'error');
      }
    };

    socket.on('disconnect', handleDisconnect);
    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [roomCode]);

  // Countdown timer for reconnect modal
  useEffect(() => {
    if (!showReconnectModal || reconnectCountdown <= 0) return;

    const interval = setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          console.log('[App] Reconnect timeout expired, leaving room');
          actions.leaveRoom();
          setShowReconnectModal(false);
          setDisconnectedRoomCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showReconnectModal, reconnectCountdown, actions]);

  // Handle successful reconnection
  useEffect(() => {
    const handleReconnect = () => {
      if (showReconnectModal) {
        console.log('[App] Socket reconnected successfully');
        setShowReconnectModal(false);
        setDisconnectedRoomCode(null);
        showToast('Reconnected successfully!', 'success');
      }
    };

    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [showReconnectModal]);

  // ------------------------------------------------------------------------
  // AUTH ACTIONS
  // ------------------------------------------------------------------------
  const handleLogin = (token: string, username: string) => {
    console.log('[App] Login successful, token:', token, 'username:', username);
    setAuthToken(token);
    setLocalPlayerName(username);
    setIsAuthenticated(true);
    setShowProfilePage(false);

    window.localStorage.setItem(STORAGE_AUTH_TOKEN, token);
    window.localStorage.setItem(STORAGE_USERNAME, username);
  };

  const handleLogout = (options?: {
    keepReconnectRoom?: boolean;
    leaveRoom?: boolean;
  }) => {
    const leaveRoom = options?.leaveRoom === true;

    // Default behavior is "disconnect-style" logout so server can allow a reconnect timeout.
    // If leaveRoom=true, we explicitly leave (removes player from room).
    actions.leaveRoom(leaveRoom, {
      clearStoredSession: leaveRoom ? true : options?.keepReconnectRoom ? false : true,
    });

    socket.disconnect();

    setIsAuthenticated(false);
    setAuthToken(null);
    setShowProfilePage(false);

    window.localStorage.removeItem(STORAGE_AUTH_TOKEN);
    window.localStorage.removeItem(STORAGE_USERNAME);
    if (!options?.keepReconnectRoom) {
      window.localStorage.removeItem('splendor:reconnectRoom');
    }
  };

  const handlePlayGuest = (guestName: string) => {
    console.log('[App] Guest login:', guestName);
    setLocalPlayerName(guestName);
    setIsAuthenticated(true);

    const token = window.localStorage.getItem(STORAGE_AUTH_TOKEN);
    if (!token) {
      window.localStorage.removeItem('splendor:reconnectRoom');
    }
  };

  // ------------------------------------------------------------------------
  // RENDER: AUTH / SETUP / LOBBY / GAME
  // ------------------------------------------------------------------------
  useEffect(() => {
    const nextPath = !isAuthenticated
      ? '/'
      : !roomCode
        ? '/'
        : gameState
          ? `/game/${roomCode}`
          : `/room/${roomCode}`;

    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, '', nextPath);
    }
  }, [isAuthenticated, roomCode, gameState]);

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onPlayGuest={handlePlayGuest}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  if (!roomCode && showProfilePage) {
    return (
      <>
        <AppToast toasts={toasts} />
        <UserProfile
          authToken={authToken}
          theme={theme}
          onBack={() => setShowProfilePage(false)}
          onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
        />
      </>
    );
  }

  if (!roomCode) {
    return (
      <>
        <AppToast toasts={toasts} />
        <SetupPage
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          publicRooms={publicRooms}
          isLoadingPublicRooms={isLoadingPublicRooms}
          onListPublicRooms={actions.listPublicRooms}
          onCreateRoom={actions.createRoom}
          onJoinRoom={actions.joinRoom}
          onJoinPublicRoom={(roomId) => actions.joinRoom('', roomId)}
          onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
          currentUsername={profile?.username || localPlayerName || 'User'}
          currentUserAvatarUrl={profile?.profile_picture || null}
          onOpenProfile={() => setShowProfilePage(true)}
          userCoins={profile?.coins ?? null}
          onNotify={onSetupNotify}
        />
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <AppToast toasts={toasts} />
        <LobbyPage
          roomCode={roomCode}
          players={lobbyPlayers.map((name, index) => ({
            id: `player-${index}`,
            name,
            isHost: index === 0,
          }))}
          isHost={isHost}
          onStartGame={actions.startGame}
          onLeaveRoom={() => actions.leaveRoom(true)}
          onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
          theme={theme}
          localPlayerName={localPlayerName}
          localUserId={profile?.id ?? null}
        />
      </>
    );
  }

  return (
    <>
      <AppToast toasts={toasts} />
      <GamePage
        theme={theme}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
        roomCode={roomCode}
        gameState={gameState}
        rematchState={rematchState}
        gameOverInfo={gameOverInfo}
        localPlayerName={localPlayerName}
        localUserId={profile?.id ?? null}
        onChatBackgroundNotify={onChatBackgroundNotify}
        pendingDisconnect={pendingDisconnect}
        pendingDisconnects={pendingDisconnects}
        onReconnectToRoom={(code) => actions.reconnectToRoom(code)}
        onExitAfterDisconnect={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
        actions={{
          sendAction: actions.sendAction,
          requestRematch: actions.requestRematch,
          leaveRoom: actions.leaveRoom,
        }}
      />
    </>
  );
}
