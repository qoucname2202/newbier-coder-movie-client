import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaTimesCircle, 
  FaFilm, 
  FaHeart 
} from 'react-icons/fa';

// Tên CustomEvent để hỗ trợ gọi alert từ bất kỳ đâu không cần hook/props
const CINEMA_ALERT_EVENT = 'cinema_alert_event';

/**
 * Hàm gọi alert dùng chung toàn ứng dụng (Dễ gọi ở bất kỳ file nào).
 * @param {string} message - Nội dung thông báo
 * @param {'cinema' | 'warning' | 'success' | 'error' | 'info' | 'heart'} [type='cinema'] - Loại alert
 * @param {number} [duration=2800] - Thời gian hiển thị (ms)
 * 
 * Ví dụ:
 *   showCinemaAlert('Bạn đã thích bộ phim này trước đó !', 'warning');
 *   showCinemaAlert('Đã thêm vào danh sách yêu thích !', 'cinema');
 */
export function showCinemaAlert(message, type = 'cinema', duration = 2800) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CINEMA_ALERT_EVENT, {
        detail: { message, type, duration, timestamp: Date.now() }
      })
    );
  }
}

// React Context dành cho component muốn dùng qua hook
const CinemaAlertContext = createContext({
  showAlert: showCinemaAlert
});

export const useCinemaAlert = () => useContext(CinemaAlertContext);

/**
 * Component hiển thị alert nổi theo chuẩn Dark Cinema.
 * Tự động gắn listener cho showCinemaAlert() và tự hủy sau khi hết thời gian.
 */
export default function CinemaAlert() {
  const [alertData, setAlertData] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const dismiss = () => {
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setAlertData(null);
      setIsClosing(false);
    }, 220);
  };

  useEffect(() => {
    const handleAlertEvent = (event) => {
      const detail = event?.detail;
      if (!detail || !detail.message) return;

      // Hủy timer cũ nếu đang chạy
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      setIsClosing(false);
      setAlertData(detail);

      const displayDuration = detail.duration || 2800;
      timerRef.current = setTimeout(() => {
        dismiss();
      }, displayDuration);
    };

    window.addEventListener(CINEMA_ALERT_EVENT, handleAlertEvent);
    return () => {
      window.removeEventListener(CINEMA_ALERT_EVENT, handleAlertEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!alertData) return null;

  // Lựa chọn icon phù hợp theo type
  const renderIcon = () => {
    switch (alertData.type) {
      case 'warning':
        return <FaExclamationTriangle className="alert-icon text-warning" />;
      case 'success':
        return <FaCheckCircle className="alert-icon text-success" />;
      case 'error':
        return <FaTimesCircle className="alert-icon text-danger" />;
      case 'info':
        return <FaInfoCircle className="alert-icon text-info" />;
      case 'heart':
        return <FaHeart className="alert-icon text-danger" />;
      case 'cinema':
      default:
        // Đỏ cinema thương hiệu
        return <FaExclamationTriangle className="alert-icon text-cinema" />;
    }
  };

  return (
    <div 
      className={`cinema-alert-container ${isClosing ? 'closing' : ''}`}
      onClick={dismiss}
      role="alert"
      aria-live="assertive"
      title="Bấm để đóng thông báo"
    >
      <div className="cinema-alert-pill">
        <div className="icon-wrapper">
          {renderIcon()}
        </div>
        <span className="alert-message">
          {alertData.message}
        </span>
      </div>

      <style jsx>{`
        .cinema-alert-container {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 999999;
          pointer-events: auto;
          cursor: pointer;
          user-select: none;
          animation: alertEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .cinema-alert-container.closing {
          animation: alertLeave 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        .cinema-alert-pill {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(20, 20, 24, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px 22px;
          color: #ffffff;
          box-shadow: 
            0 12px 36px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          max-width: 90vw;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }

        .cinema-alert-pill:hover {
          background: rgba(26, 26, 32, 0.96);
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        :global(.alert-icon.text-cinema) {
          color: #e50914 !important;
        }

        :global(.alert-icon.text-warning) {
          color: #fbbf24 !important;
        }

        :global(.alert-icon.text-success) {
          color: #10b981 !important;
        }

        :global(.alert-icon.text-danger) {
          color: #ef4444 !important;
        }

        :global(.alert-icon.text-info) {
          color: #38bdf8 !important;
        }

        .alert-message {
          font-size: 0.92rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #ffffff;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @keyframes alertEnter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes alertLeave {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
        }

        @media (max-width: 576px) {
          .cinema-alert-container {
            bottom: 20px;
            right: 16px;
            left: 16px;
            width: auto;
          }

          .cinema-alert-pill {
            width: 100%;
            justify-content: center;
            padding: 9px 16px;
            font-size: 0.88rem;
          }

          .alert-message {
            font-size: 0.86rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
