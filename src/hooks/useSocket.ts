import { useWebSocket } from '@/context/WebSocketContext';
import { useCallback } from 'react';

export const useSocket = () => {
  const { socket, isConnected } = useWebSocket();

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }, [socket, isConnected]);

  const subscribeToEvent = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
      
      // Return unsubscribe function
      return () => {
        socket.off(event, callback);
      };
    }
    return () => {};
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    subscribeToEvent
  };
}; 