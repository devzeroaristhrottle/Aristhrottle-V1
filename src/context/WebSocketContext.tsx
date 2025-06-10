import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect in browser environment
    if (typeof window !== 'undefined') {
      // Determine the WebSocket URL based on environment
      const socketUrl = process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:3000';

      const socketInstance = io(socketUrl);

      socketInstance.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('message', (message) => {
        console.log('Message from server:', message);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 