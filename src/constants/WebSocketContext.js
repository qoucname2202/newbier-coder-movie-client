import React, { createContext, useContext, useEffect, useState } from 'react';

// Context để quản lý WebSocket
const WebSocketContext = createContext(null);

// Hook để sử dụng WebSocket
export const useWebSocket = () => useContext(WebSocketContext);

// Provider bao bọc các component con để chia sẻ kết nối WebSocket
export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  // Khởi tạo kết nối WebSocket
  useEffect(() => {
    // Tạo kết nối WebSocket
    const ws = new WebSocket('ws://localhost:5000');

    // Xử lý sự kiện khi kết nối mở
    ws.onopen = () => {
      console.log('WebSocket kết nối thành công');
      setIsConnected(true);

      // Gửi thông tin xác thực nếu có token
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (token) {
        ws.send(JSON.stringify({
          type: 'authenticate',
          token
        }));
      }
    };

    // Xử lý khi nhận tin nhắn
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        setLastMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    // Xử lý khi kết nối đóng
    ws.onclose = () => {
      console.log('WebSocket đã ngắt kết nối');
      setIsConnected(false);
    };

    // Xử lý lỗi
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Lưu socket vào state
    setSocket(ws);

    // Đóng kết nối khi unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Cung cấp các giá trị và phương thức cho các component con
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