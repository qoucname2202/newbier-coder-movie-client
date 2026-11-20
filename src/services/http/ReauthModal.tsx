/**
 * @file ReauthModal.tsx
 * @description Accessible, Cinema Glassmorphic Re-authentication Modal.
 * Renders on top of the current screen to ensure zero user data loss when session refresh fails.
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { FaLock, FaUser, FaEye, FaEyeSlash, FaSpinner, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useReauthModal } from './useReauthModal';
import { useAuth } from '@/context/AuthContext';

export const ReauthModal: React.FC = () => {
  const { isOpen, isLoading, errorMessage, pendingCount, submitReauth, cancelReauth } = useReauthModal();
  const { user } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Pre-fill username from current user session if available
  useEffect(() => {
    if (isOpen) {
      const u = user as { username?: string; email?: string } | null;
      if (u?.username || u?.email) {
        setUsername(u.username || u.email || '');
      }
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!password) return;
    await submitReauth({ username, password });
  };

  const handleCancelClick = (): void => {
    cancelReauth();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(135deg, rgba(26, 32, 48, 0.95), rgba(15, 18, 28, 0.98))',
          border: '1px solid rgba(229, 9, 20, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(229, 9, 20, 0.15)',
          padding: '2rem',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(229, 9, 20, 0.05))',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: '#e50914'
            }}
          >
            <FaShieldAlt size={24} />
          </div>

          <h3
            id="reauth-modal-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: '0 0 0.5rem',
              letterSpacing: '-0.01em'
            }}
          >
            Xác Thực Lại Phiên Đăng Nhập
          </h3>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              lineHeight: 1.5
            }}
          >
            Phiên làm việc đã hết hạn. Vui lòng nhập lại mật khẩu để tiếp tục thao tác mà{' '}
            <strong style={{ color: '#4ade80' }}>không làm mất dữ liệu</strong> đang nhập.
          </p>

          {pendingCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '0.75rem',
                color: '#60a5fa'
              }}
            >
              <FaExclamationTriangle size={11} />
              <span>Đang tạm giữ {pendingCount} thao tác chờ xử lý</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaExclamationTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username / Email field */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.35rem'
              }}
            >
              Tài khoản / Email
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                <FaUser size={14} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email"
                disabled={isLoading}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.35rem'
              }}
            >
              Mật khẩu xác nhận
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                <FaLock size={14} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                disabled={isLoading}
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 2.6rem 0.65rem 2.4rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={isLoading || !password}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: isLoading ? 'rgba(229, 9, 20, 0.5)' : '#e50914',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)'
              }}
            >
              {isLoading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Xác Nhận & Tiếp Tục Thao Tác</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Hủy bỏ (Bảo toàn dữ liệu form)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
