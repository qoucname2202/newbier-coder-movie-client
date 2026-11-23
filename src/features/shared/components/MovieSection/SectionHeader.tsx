import React from 'react';
import Link from 'next/link';
import { FaFire, FaHeart, FaDragon, FaCrown, FaBolt, FaStar } from 'react-icons/fa';
import { getTaxonomyName } from '@/utils/taxonomy';
import styles from '@/styles/MovieCards.module.css';

/**
 * @file SectionHeader.tsx
 * @description Cinematic section heading with gradient accent bar, typography, and interactive link.
 */

const resolveHeaderBadgeInfo = (badge?: string) => {
  if (!badge) return null;
  const raw = String(badge).trim();
  const lower = raw.toLowerCase();

  if (lower.includes('hot')) {
    return {
      icon: <FaFire style={{ color: '#fef08a', fontSize: '0.68rem' }} aria-hidden="true" />,
      className: styles.badgeHot
    };
  }
  if (lower.includes('k-dram') || lower.includes('korean') || lower.includes('hàn')) {
    return {
      icon: <FaHeart style={{ color: '#ffffff', fontSize: '0.62rem' }} aria-hidden="true" />,
      className: styles.badgeKdrama
    };
  }
  if (lower.includes('c-dram') || lower.includes('chinese') || lower.includes('trung')) {
    return {
      icon: <FaDragon style={{ color: '#fde047', fontSize: '0.68rem' }} aria-hidden="true" />,
      className: styles.badgeCdrama
    };
  }
  if (lower.includes('trend') || lower.includes('top')) {
    return {
      icon: <FaCrown style={{ color: '#fef08a', fontSize: '0.68rem' }} aria-hidden="true" />,
      className: styles.badgeTrending
    };
  }
  if (lower.includes('anime') || lower.includes('cartoon') || lower.includes('hoạt')) {
    return {
      icon: <FaBolt style={{ color: '#a5f3fc', fontSize: '0.68rem' }} aria-hidden="true" />,
      className: styles.badgeAnime
    };
  }
  if (lower.includes('mới') || lower.includes('new') || lower.includes('latest')) {
    return {
      icon: <FaStar style={{ color: '#d1fae5', fontSize: '0.68rem' }} aria-hidden="true" />,
      className: styles.badgeNew
    };
  }
  return {
    icon: <FaFire style={{ color: '#fef08a', fontSize: '0.68rem' }} aria-hidden="true" />,
    className: styles.headerBadge
  };
};

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
  const badgeInfo = resolveHeaderBadgeInfo(badge);
  const badgeText = typeof badge === 'string' ? badge : getTaxonomyName(badge);

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
            <span className={`${styles.headerBadge} ${badgeInfo?.className || ''}`}>
              {badgeInfo?.icon}
              <span>{badgeText}</span>
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
