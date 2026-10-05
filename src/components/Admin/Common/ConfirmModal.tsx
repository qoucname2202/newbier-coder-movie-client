import React from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div
      className="custom-confirm-backdrop"
      onClick={onCancel}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="custom-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-confirm-header">
          <div className="custom-confirm-title-wrap">
            <div className="custom-confirm-icon-box">
              <FaExclamationTriangle />
            </div>
            <h5 className="custom-confirm-title">{title}</h5>
          </div>
          <button
            type="button"
            className="custom-confirm-close"
            onClick={onCancel}
            title="Đóng"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="custom-confirm-body">
          <p className="custom-confirm-message">{message}</p>
        </div>

        <div className="custom-confirm-footer">
          <button
            type="button"
            className="custom-confirm-btn custom-confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="custom-confirm-btn custom-confirm-btn-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-confirm-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1060;
          padding: 16px;
          animation: fadeIn 0.15s ease-out;
        }

        .custom-confirm-card {
          background-color: #111723;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          animation: scaleIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .custom-confirm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: #141b29;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .custom-confirm-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .custom-confirm-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;
        }

        .custom-confirm-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .custom-confirm-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1rem;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s ease;
        }

        .custom-confirm-close:hover {
          color: #ffffff;
        }

        .custom-confirm-body {
          padding: 20px;
          background-color: #111723;
        }

        .custom-confirm-message {
          color: #cbd5e1;
          font-size: 0.92rem;
          line-height: 1.6;
          margin: 0;
        }

        .custom-confirm-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          background-color: #0e131d;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }

        .custom-confirm-btn {
          height: 36px;
          padding: 0 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .custom-confirm-btn-cancel {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
        }

        .custom-confirm-btn-cancel:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .custom-confirm-btn-confirm {
          background-color: #e50914;
          border: 1px solid #e50914;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(229, 9, 20, 0.25);
        }

        .custom-confirm-btn-confirm:hover {
          background-color: #c10711;
          border-color: #c10711;
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;