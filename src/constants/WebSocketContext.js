import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      setIsConnected(true);

      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (token) {
        ws.send(JSON.stringify({
          type: 'authenticate',
          token
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    lastMessage,
    send: (message) => {
      if (socket && isConnected) {
        socket.send(typeof message === 'object' ? JSON.stringify(message) : message);
      }
    }
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};