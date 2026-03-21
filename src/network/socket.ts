import { io, Socket } from 'socket.io-client';

// In production we want to connect from the same origin (behind Nginx).
// Optionally override via VITE_SOCKET_URL at build time.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when needed
});

// Basic event listeners for debugging
socket.on('connect', () => {
  console.log('[Socket] Connected to server with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error.message);
});
