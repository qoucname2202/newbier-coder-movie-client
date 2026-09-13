import React from 'react';
import { FaLock, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '../../utils/auth';
import { useRouter } from 'next/router';

const AccountLockedBanner = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="account-locked-banner">
      <div className="banner-content">
        <div className="lock-icon">
          <FaLock />
        </div>
        <div className="banner-text">
          <h4>Tài khoản của bạn đã bị khóa</h4>
          <p>
            Tài khoản của bạn đã bị tạm khóa vì vi phạm điều khoản sử dụng của chúng tôi. 
            Vui lòng liên hệ quản trị viên để được hỗ trợ mở khóa tài khoản.
          </p>
          <div className="banner-actions">
            <a href="mailto:support@moviestreaming.com" className="contact-button">
              <FaEnvelope /> Liên hệ hỗ trợ
            </a>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-locked-banner {
          background: linear-gradient(135deg, #e50914 0%, #8b0000 100%);
          color: white;
          padding: 1.5rem;
          margin: 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .banner-content {
          display: flex;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          gap: 1.5rem;
        }

        .lock-icon {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .banner-text {
          flex: 1;
        }

        .banner-text h4 {
          margin: 0 0 0.5rem;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .banner-text p {
          margin: 0 0 1rem;
          font-size: 0.95rem;
          line-height: 1.5;
          opacity: 0.9;
        }

        .banner-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .contact-button, .logout-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }

        .contact-button {
          background-color: white;
          color: #e50914;
        }

        .contact-button:hover {
          background-color: #f8f8f8;
          transform: translateY(-2px);
        }

        .logout-button {
          background-color: rgba(0, 0, 0, 0.3);
          color: white;
        }

        .logout-button:hover {
          background-color: rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            text-align: center;
            padding: 0.5rem;
          }

          .banner-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountLockedBanner;