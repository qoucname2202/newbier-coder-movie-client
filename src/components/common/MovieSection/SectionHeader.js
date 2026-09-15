import React from 'react';
import Link from 'next/link';
import styles from '@/styles/MovieCards.module.css';

/**
 * @file SectionHeader.js
 * @description Cinematic section heading with gradient accent bar, typography, and interactive link.
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the section (e.g. "Phim Đề Xuất")
 * @param {React.ReactNode} [props.icon] - Optional icon element
 * @param {string} [props.badge] - Optional badge tag (e.g. "HOT", "MỚI")
 * @param {string} [props.viewAllHref] - Target URL for "Xem tất cả" link
 * @param {string} [props.viewAllText="Xem tất cả"] - Label for view all link
 * @param {string} [props.className=""] - Additional class name
 * @returns {JSX.Element}
 */
const SectionHeader = ({
  title,
  icon,
  badge,
  viewAllHref,
  viewAllText = "Xem tất cả",
  className = ""
}) => {
  return (
    <header className={`${styles.sectionHeader} ${className}`}>
      <div className={styles.headerLeft}>
        <span className={styles.accentBar} aria-hidden="true" />
        <h2 className={styles.headerTitle}>
          {icon && <span className={styles.headerIcon}>{icon}</span>}
          <span>{title}</span>
          {badge && <span className={styles.headerBadge}>{badge}</span>}
        </h2>
      </div>

      {viewAllHref && (
        <Link href={viewAllHref} className={styles.viewAllLink}>
          <span>{viewAllText}</span>
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
