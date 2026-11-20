import React from 'react';
import Link from 'next/link';
import { getTaxonomyName } from '@/utils/taxonomy';
import styles from '@/styles/MovieCards.module.css';

/**
 * @file SectionHeader.tsx
 * @description Cinematic section heading with gradient accent bar, typography, and interactive link.
 */

export interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  viewAllHref?: string;
  viewAllText?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  badge,
  viewAllHref,
  viewAllText = 'Xem tất cả',
  className = ''
}) => {
  return (
    <header className={`${styles.sectionHeader} ${className}`}>
      <div className={styles.headerLeft}>
        <span className={styles.accentBar} aria-hidden="true" />
        <div className={styles.headerTitleWrap}>
          <h2 className={styles.headerTitle}>
            {icon && <span className={styles.headerIcon}>{icon}</span>}
            <span className={styles.titleText}>{typeof title === 'string' ? title : getTaxonomyName(title)}</span>
          </h2>
          {badge && (
            <span className={styles.headerBadge}>
              {typeof badge === 'string' ? badge : getTaxonomyName(badge)}
            </span>
          )}
        </div>
      </div>

      {viewAllHref && (
        <Link href={viewAllHref} className={styles.viewAllLink} title="Xem tất cả">
          <span>{typeof viewAllText === 'string' ? viewAllText : getTaxonomyName(viewAllText, 'Xem tất cả')}</span>
          <svg
            className={styles.viewAllArrow}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}
    </header>
  );
};

export default SectionHeader;
