/**
 * @file FormatSkeletonGrid.tsx
 * @description Accessible loading skeleton grid matching responsive 2-to-6 columns layout.
 */

import React from 'react';
import styles from '@/styles/FormatPage.module.css';

export interface FormatSkeletonGridProps {
  count?: number;
}

export const FormatSkeletonGrid: React.FC<FormatSkeletonGridProps> = ({ count = 20 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      className={styles.movieGrid}
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách phim..."
    >
      {items.map((key) => (
        <div key={key} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonPoster} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} style={{ width: '85%' }} />
            <div className={styles.skeletonLine} style={{ width: '55%', height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
