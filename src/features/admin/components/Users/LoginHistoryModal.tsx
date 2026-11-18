// src/components/Admin/Users/LoginHistoryModal.tsx
'use client';

import React from 'react';
import {
  FaTimes,
  FaHistory,
  FaDesktop,
  FaMobileAlt,
  FaUnlock,
  FaCheckCircle,
  FaMapMarkerAlt
} from 'react-icons/fa';
import styles from '@/styles/LoginHistoryModal.module.css';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';

export interface LoginHistoryItem {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  deviceType: 'desktop' | 'mobile';
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    _id?: string;
    fullname: string;
    email: string;
    isActive?: boolean;
  } | null;
  onUnblock?: (userId: string) => void;
}

const MOCK_HISTORY: LoginHistoryItem[] = [
  {
    id: 'log-1',
    timestamp: '13:45 · Hôm nay (11/10/2026)',
    ipAddress: '113.161.42.18',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    device: 'Windows 11',
    browser: 'Chrome 129.0',
    deviceType: 'desktop',
    status: 'SUCCESS'
  },
  {
    id: 'log-2',
    timestamp: '20:15 · Hôm qua (10/10/2026)',
    ipAddress: '14.232.180.95',
    location: 'Hà Nội, Việt Nam',
    device: 'iPhone 16 Pro (iOS 18)',
    browser: 'Safari Mobile',
    deviceType: 'mobile',
    status: 'SUCCESS'
  },
  {
    id: 'log-3',
    timestamp: '09:20 · 09/10/2026',
    ipAddress: '42.112.24.5',
    location: 'Đà Nẵng, Việt Nam',
    device: 'MacBook Pro (macOS Sonoma)',
    browser: 'Brave Browser',
    deviceType: 'desktop',
    status: 'SUCCESS'
  },
  {
    id: 'log-4',
    timestamp: '03:12 · 08/10/2026',
    ipAddress: '185.220.101.5',
    location: 'Frankfurt, Đức (VPN / Tor)',
    device: 'Linux x86_64',
    browser: 'Firefox 130',
    deviceType: 'desktop',
    status: 'FAILED',
    reason: 'Mật khẩu không chính xác (3 lần)'
  }
];

export default function LoginHistoryModal({
  isOpen,
  onClose,
  user,
  onUnblock
}: LoginHistoryModalProps) {
  if (!isOpen || !user) return null;

  const isBlocked = user.isActive === false;

  const handleUnblock = () => {
    if (user._id && onUnblock) {
      onUnblock(user._id);
    }
    showCinemaAlert(`Đã mở khóa tài khoản cho ${user.fullname}!`, 'cinema');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <FaHistory />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Nhật Ký Đăng Nhập & Bảo Mật</h3>
              <div className={styles.userSubtitle}>
                Kiểm toán lịch sử IP, thiết bị và các phiên truy cập của tài khoản
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* User Banner */}
          <div className={styles.profileBanner}>
            <div className={styles.userCardLeft}>
              <div className={styles.avatar}>
                {user.fullname.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={styles.userName}>{user.fullname}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>

            {isBlocked ? (
              <button
                type="button"
                className={styles.unblockBtn}
                onClick={handleUnblock}
                title="Gỡ khóa tài khoản"
              >
                <FaUnlock /> Mở Khóa Tài Khoản
              </button>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FaCheckCircle /> Đang hoạt động
              </span>
            )}
          </div>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              Lịch sử các phiên đăng nhập gần nhất
            </div>

            <div className={styles.timelineContainer}>
              {MOCK_HISTORY.map((item) => (
                <div key={item.id} className={styles.timelineItem}>
                  <div className={styles.deviceIconBox}>
                    {item.deviceType === 'desktop' ? <FaDesktop /> : <FaMobileAlt />}
                  </div>

                  <div className={styles.timelineDetails}>
                    <div className={styles.timelineTopRow}>
                      <span className={styles.deviceTitle}>
                        {item.device} • {item.browser}
                      </span>
                      <span className={styles.loginTime}>{item.timestamp}</span>
                    </div>

                    <div className={styles.timelineMeta}>
                      <span className={styles.ipBadge}>IP: {item.ipAddress}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaMapMarkerAlt style={{ color: '#9ca3af', fontSize: '0.7rem' }} />
                        {item.location}
                      </span>
                      <span className={item.status === 'SUCCESS' ? styles.statusSuccess : styles.statusFailed}>
                        {item.status === 'SUCCESS' ? (
                          '✓ Thành công'
                        ) : (
                          `✕ Thất bại: ${item.reason}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
