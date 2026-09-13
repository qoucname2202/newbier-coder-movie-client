import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminNotifications = () => {
  const { lastMessage, isConnected } = useWebSocket();
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");

  // Xử lý thông báo từ WebSocket
  useEffect(() => {
    if (lastMessage) {
      // Xác định nội dung thông báo dựa trên loại hành động
      let notificationContent = '';
      
      if (lastMessage.type === 'movie') {
        switch (lastMessage.action) {
          case 'created':
            notificationContent = `Phim "${lastMessage.data.name}" đã được thêm mới`;
            toast.success(notificationContent);
            break;
          case 'updated':
            notificationContent = `Phim "${lastMessage.data.name}" đã được cập nhật`;
            toast.info(notificationContent);
            break;
          case 'deleted':
            notificationContent = `Phim "${lastMessage.data.name}" đã bị xóa`;
            toast.warning(notificationContent);
            break;
          case 'statusChanged':
            const status = lastMessage.data.status === 'active' ? 'kích hoạt' : 'ẩn';
            notificationContent = `Phim "${lastMessage.data.name}" đã được ${status}`;
            toast.info(notificationContent);
            break;
          default:
            notificationContent = `Có thay đổi dữ liệu: ${JSON.stringify(lastMessage)}`;
            toast.info(notificationContent);
        }
      } else if (lastMessage.type === 'user') {
        // Xử lý thông báo liên quan đến người dùng
        switch (lastMessage.action) {
          case 'created':
            notificationContent = `Người dùng mới "${lastMessage.data.username}" đã được tạo`;
            toast.success(notificationContent);
            break;
          case 'updated':
            notificationContent = `Người dùng "${lastMessage.data.username}" đã được cập nhật`;
            toast.info(notificationContent);
            break;
          default:
            notificationContent = `Có thay đổi dữ liệu người dùng: ${JSON.stringify(lastMessage)}`;
            toast.info(notificationContent);
        }
      }

      console.log('Notification:', notificationContent);
    }
  }, [lastMessage]);

  // Cập nhật trạng thái kết nối
  useEffect(() => {
    setConnectionStatus(isConnected ? "Đã kết nối" : "Mất kết nối");
  }, [isConnected]);

  return (
    <>
      <div className="socket-status" style={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        color: 'white',
        background: isConnected ? '#28a745' : '#dc3545',
        zIndex: 1000
      }}>
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
        <span className="status-text">WebSocket: {connectionStatus}</span>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <style jsx>{`
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .connected {
          background-color: #28a745;
          box-shadow: 0 0 5px #28a745;
        }
        .disconnected {
          background-color: #dc3545;
          box-shadow: 0 0 5px #dc3545;
        }
      `}</style>
    </>
  );
};

export default AdminNotifications;