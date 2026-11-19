import React, { useState } from 'react';
import { getTaxonomyList } from '@/utils/taxonomy';
import styles from './MovieMetaBento.module.css';

/**
 * @file MovieMetaBento.tsx
 * @description Two-column bento card: Collapsible synopsis overview on the left,
 * and high-density technical specifications on the right.
 */

interface CountryEntry {
  name?: string;
  slug?: string;
}

interface CategoryEntry {
  name?: string;
  slug?: string;
}

interface DirectorEntry {
  name?: string;
}

export interface MovieMetaBentoMovie {
  content?: string;
  country?: CountryEntry[];
  category?: CategoryEntry[];
  directors?: DirectorEntry[];
  director?: string;
  type?: 'series' | 'single' | string;
  view?: number;
  rating?: number | string;
  ratingCount?: number;
}

export interface MovieMetaBentoProps {
  movie?: MovieMetaBentoMovie | null;
}

const MovieMetaBento: React.FC<MovieMetaBentoProps> = ({ movie }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!movie) return null;

  const content = movie.content || 'Nội dung bộ phim đang được cập nhật.';
  const isLong = content.length > 280;

  const countries = getTaxonomyList(movie.country) || 'Đang cập nhật';
  const categories = getTaxonomyList(movie.category) || 'Đang cập nhật';
  const directorNames = movie.directors && movie.directors.length > 0
    ? movie.directors.map((d) => d.name).join(', ')
    : (movie.director ? String(movie.director) : 'Đang cập nhật');

  return (
    <div className={styles.metaBentoContainer}>
      {/* Left Column: Synopsis */}
      <div className={styles.synopsisCard}>
        <div className={styles.cardHeader}>
          <i className="fas fa-align-left text-danger" />
          <h3 className={styles.cardTitle}>Nội Dung Phim</h3>
        </div>

        <p className={`${styles.synopsisText} ${!isExpanded && isLong ? styles.synopsisTextClamped : ''}`}>
          {content}
        </p>

        {isLong && (
          <button
            type="button"
            className={styles.btnExpand}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem toàn bộ nội dung'}</span>
            <i className={isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'} />
          </button>
        )}
      </div>

      {/* Right Column: Technical Specs Bento */}
      <div className={styles.specsCard}>
        <div className={styles.cardHeader}>
          <i className="fas fa-circle-info text-danger" />
          <h3 className={styles.cardTitle}>Thông Tin Chi Tiết</h3>
        </div>

        <div className={styles.specsList}>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-user-tie" /> Đạo diễn
            </span>
            <span className={styles.specValue}>{directorNames}</span>
          </div>

          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-globe" /> Quốc gia
            </span>
            <span className={styles.specValue}>{countries}</span>
          </div>

          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-tags" /> Thể loại
            </span>
            <span className={styles.specValue}>{categories}</span>
          </div>

          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-clapperboard" /> Định dạng
            </span>
            <span className={styles.specValue}>
              {movie.type === 'series' ? 'Phim Bộ (Nhiều tập)' : 'Phim Lẻ (Chiếu rạp)'}
            </span>
          </div>

          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-eye" /> Lượt xem
            </span>
            <span className={styles.specValue}>
              {Number(movie.view || 0).toLocaleString('vi-VN')} lượt
            </span>
          </div>

          <div className={styles.specItem}>
            <span className={styles.specLabel}>
              <i className="fas fa-star text-warning" /> Điểm IMDb
            </span>
            <span className={styles.specValue}>
              {movie.rating} / 10 ({movie.ratingCount || 100} lượt bình chọn)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieMetaBento;
