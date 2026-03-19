import React, { useEffect, useState } from 'react';
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

const STORAGE_AUTH_TOKEN = 'splendor:authToken';
const STORAGE_USERNAME = 'splendor:username';

export default function App() {
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

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  // UI States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showProfilePage, setShowProfilePage] = useState(false);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const {
    room: { roomCode, lobbyPlayers, isHost },
    gameState,
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
    onToast: ({ message, type }) => showToast(message, type),
  });

  const { profile } = useUserProfile(authToken);

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
      <UserProfile
        authToken={authToken}
        theme={theme}
        onBack={() => setShowProfilePage(false)}
        onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
      />
    );
  }

  if (!roomCode) {
    return (
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
      />
    );
  }

  if (!gameState) {
    return (
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
      />
    );
  }

  return (
    <GamePage
      theme={theme}
      onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      onLogout={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
      roomCode={roomCode}
      gameState={gameState}
      rematchState={rematchState}
      localPlayerName={localPlayerName}
      pendingDisconnect={pendingDisconnect}
      pendingDisconnects={pendingDisconnects}
      toast={toast}
      onReconnectToRoom={(code) => actions.reconnectToRoom(code)}
      onExitAfterDisconnect={() => handleLogout({ keepReconnectRoom: false, leaveRoom: true })}
      actions={{
        sendAction: actions.sendAction,
        requestRematch: actions.requestRematch,
        leaveRoom: actions.leaveRoom,
      }}
    />
  );
}
