/**
 * @file CountrySkeletonGrid.tsx
 * @description Shimmer skeleton placeholder for the responsive movie grid while data is loading.
 */

import React from 'react';
import styles from '@/styles/CountryPage.module.css';

export interface CountrySkeletonGridProps {
  count?: number;
}

export const CountrySkeletonGrid: React.FC<CountrySkeletonGridProps> = ({ count = 18 }) => {
  return (
    <div className={styles.movieGrid} aria-busy="true" aria-label="Đang tải danh sách phim...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-${i}`} className={styles.skeletonCard}>
          <div className={styles.skeletonPoster} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} style={{ width: '85%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%', marginTop: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CountrySkeletonGrid;
