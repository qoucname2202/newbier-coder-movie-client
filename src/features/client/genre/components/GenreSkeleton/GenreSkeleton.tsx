/**
 * @file GenreSkeleton.tsx
 * @description Polished shimmer skeleton grid for initial load and bottom pulse spinner for scroll loading.
 */

import React from 'react';
import styles from './GenreSkeleton.module.css';

export interface GenreGridSkeletonProps {
  count?: number;
}

export const GenreGridSkeleton: React.FC<GenreGridSkeletonProps> = ({ count = 18 }) => {
  return (
    <div className={styles.skeletonGrid} aria-label="Đang tải danh sách phim...">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`genre-skeleton-${index}`} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonPoster} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const GenreScrollLoader: React.FC = () => {
  return (
    <div className={styles.scrollLoaderWrapper} aria-live="polite">
      <div className={styles.spinnerContainer}>
        <div className={styles.spinnerDot} />
        <span className={styles.spinnerText}>Đang tải thêm phim...</span>
      </div>
    </div>
  );
};
