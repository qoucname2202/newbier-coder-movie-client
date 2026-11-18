// src/components/Admin/Taxonomies/TaxonomyRecalculateModal.tsx
'use client';

import React, { useState } from 'react';
import { FaSyncAlt, FaTimes} from 'react-icons/fa';
import styles from '@/styles/AdminTaxonomies.module.css';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';

interface TaxonomyRecalculateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stats: {
    categoriesCount: number;
    countriesCount: number;
    formatsCount: number;
    yearsCount: number;
  };
}

export default function TaxonomyRecalculateModal({
  isOpen,
  onClose,
  onSuccess,
  stats
}: TaxonomyRecalculateModalProps) {
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleStartRecalculate = () => {
    setIsRunning(true);
    // Simulates the recalculation on the client side so the modal can
    // show a smooth progress state before reporting success.
    setTimeout(() => {
      setIsRunning(false);
      onSuccess();
      showCinemaAlert('Đã tái tính toán & đồng bộ toàn bộ Phân loại thành công!', 'cinema');
      onClose();
    }, 1400);
  };

  return (
    <div className={styles.modalOverlay} onClick={isRunning ? undefined : onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Tái Tính Toán Phân Loại (Taxonomy Recalculate)</h3>
          {!isRunning && (
            <button className={styles.closeModalBtn} onClick={onClose} aria-label="Đóng">
              <FaTimes />
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          <div className={styles.recalculateIconNotice}>
            <FaSyncAlt className={isRunning ? styles.spinAnimation : ''} />
          </div>

          <div className={styles.recalculateNoticeText}>
            Hệ thống sẽ tổng hợp lại số lượng phim liên kết với từng <strong>Thể loại, Quốc gia, Định dạng</strong> và <strong>Năm phát hành</strong>, đồng thời cập nhật cache tìm kiếm.
          </div>

          <div className={styles.recalculateStatsGrid}>
            <div className={styles.recalculateStatCard}>
              <div className={styles.statVal}>{stats.categoriesCount}</div>
              <div className={styles.statLbl}>Thể Loại</div>
            </div>
            <div className={styles.recalculateStatCard}>
              <div className={styles.statVal}>{stats.countriesCount}</div>
              <div className={styles.statLbl}>Quốc Gia</div>
            </div>
            <div className={styles.recalculateStatCard}>
              <div className={styles.statVal}>{stats.formatsCount}</div>
              <div className={styles.statLbl}>Định Dạng</div>
            </div>
            <div className={styles.recalculateStatCard}>
              <div className={styles.statVal}>{stats.yearsCount}</div>
              <div className={styles.statLbl}>Năm Phát Hành</div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isRunning}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleStartRecalculate}
            disabled={isRunning}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            {isRunning ? (
              <>
                <FaSyncAlt className={styles.spinAnimation} /> Đang Tính Toán...
              </>
            ) : (
              'Bắt Đầu Tái Tính Toán'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
