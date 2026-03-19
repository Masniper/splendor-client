import { io, Socket } from 'socket.io-client';

// Change this to your actual backend URL when deploying
const SOCKET_URL = 'http://localhost:5001';

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
