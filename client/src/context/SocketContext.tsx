import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // If we're developing locally, use localhost:3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  
  // Production fallback
  return 'https://code-to-impress-server.onrender.com';
};

const SOCKET_URL = getSocketUrl();

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  room: any;
  setRoom: React.Dispatch<React.SetStateAction<any>>;
}

const SocketContext = createContext<SocketContextProps>({ 
  socket: null, 
  isConnected: false, 
  room: null, 
  setRoom: () => {} 
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');

      // Only try to reconnect when user is actually on a room URL (e.g. refreshed on /room/XYZ).
      // Prevents "Room not found or reconnect window expired" / "game is not in a reconnectable state"
      // when opening a new tab at "/" or when reloading with stale localStorage.
      try {
        const pathMatch = typeof window !== 'undefined' && window.location.pathname.match(/^\/room\/([^/]+)$/);
        const currentRoomId = pathMatch ? pathMatch[1] : null;
        const storedRoomId = localStorage.getItem('cti_lastRoomId');
        const storedPlayerId = localStorage.getItem('cti_lastPlayerId');
        if (currentRoomId && storedRoomId === currentRoomId && storedPlayerId) {
          newSocket.emit('reconnectRoom', {
            roomId: storedRoomId,
            previousId: storedPlayerId,
          });
        }
      } catch {
        // localStorage may be unavailable; ignore
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, room, setRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
