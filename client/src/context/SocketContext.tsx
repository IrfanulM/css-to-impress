import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
