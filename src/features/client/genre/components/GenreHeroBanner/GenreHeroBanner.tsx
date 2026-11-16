/**
 * @file GenreHeroBanner.tsx
 * @description Immersive cinematic hero section showcasing genre title, dynamic ambient glow,
 * curated description, live metrics, and horizontal sub-genre switcher pills.
 */

import React from 'react';
import Link from 'next/link';
import { GenreThemeConfig } from '../../types/genre.types';
import { TAXONOMY_CATEGORIES } from '@/config/taxonomyConfig';
import { FaFilm, FaTv, FaStar, FaCompass } from 'react-icons/fa';
import styles from './GenreHeroBanner.module.css';

export interface GenreHeroBannerProps {
  themeConfig: GenreThemeConfig;
  totalMovies: number;
  currentSlug: string;
}

const GenreHeroBanner: React.FC<GenreHeroBannerProps> = ({
  themeConfig,
  totalMovies,
  currentSlug
}) => {
  const categoryList = Object.values(TAXONOMY_CATEGORIES);

  return (
    <section
      className={styles.heroWrapper}
      style={{
        // Inject dynamic theme colors into CSS custom properties
        ['--genre-accent-color' as string]: themeConfig.accentColor,
        ['--genre-accent-glow' as string]: themeConfig.glowColor
      }}
      aria-label={`Chủ đề phim ${themeConfig.title}`}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.meshGrid} aria-hidden="true" />

      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumbNav} aria-label="Đường dẫn trang">
          <Link href="/" className={styles.breadcrumbLink}>
            Trang Chủ
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/search" className={styles.breadcrumbLink}>
            Chủ Đề
          </Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbActive} aria-current="page">
            {themeConfig.title}
          </span>
        </nav>

        {/* Hero Header Body */}
        <div className={styles.headerContent}>
          <div className={styles.badgeRow}>
            <span className={styles.genreBadge}>
              <span className={styles.badgePulseDot} />
              {themeConfig.badge}
            </span>
            <span className={styles.exclusiveBadge}>
              CINEMA EXCLUSIVE
            </span>
          </div>

          <h1 className={styles.genreTitle}>
            {themeConfig.title}
          </h1>

          <p className={styles.genreTagline}>
            {themeConfig.tagline}
          </p>

          {/* Quick Metrics Strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <FaFilm className="text-secondary" />
              <span>Kho phim:</span>
              <strong className={styles.statHighlight}>
                {totalMovies > 0 ? `${totalMovies}+ Tác phẩm` : 'Đang cập nhật'}
              </strong>
            </div>

            <div className={styles.statItem}>
              <FaStar style={{ color: '#fbbf24' }} />
              <span>Chất lượng:</span>
              <strong className={styles.statHighlight}>4K UHD & FHD</strong>
            </div>

            <div className={styles.statItem}>
              <FaTv className="text-secondary" />
              <span>Định dạng:</span>
              <strong className={styles.statHighlight}>Vietsub & Thuyết minh</strong>
            </div>
          </div>
        </div>

        {/* Sub-Genre Quick Switcher Rail */}
        <div className={styles.subGenreRail}>
          <div className={styles.railHeader}>
            <h2 className={styles.railTitle}>
              <FaCompass className="me-2" style={{ color: themeConfig.accentColor }} />
              Khám Phá Các Chủ Đề Khác
            </h2>
          </div>

          <div className={styles.pillsContainer} role="tablist" aria-label="Chuyển đổi chủ đề phim nhanh">
            {categoryList.map((cat) => {
              const isActive = cat.slug === currentSlug;
              return (
                <Link
                  key={cat.slug}
                  href={`/genre/${cat.slug}`}
                  className={`${styles.genrePill} ${isActive ? styles.genrePillActive : ''}`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span>{cat.nameVi}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenreHeroBanner;
