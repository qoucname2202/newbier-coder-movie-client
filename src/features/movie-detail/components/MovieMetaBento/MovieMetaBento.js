import React, { useState } from 'react';
import styles from './MovieMetaBento.module.css';

/**
 * @file MovieMetaBento.js
 * @description Two-column bento card: Collapsible synopsis overview on the left,
 * and high-density technical specifications on the right.
 *
 * @param {Object} props
 * @param {Object} props.movie - Normalized movie object.
 */
export default function MovieMetaBento({ movie }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!movie) return null;

  const content = movie.content || 'Nội dung bộ phim đang được cập nhật.';
  const isLong = content.length > 280;

  const countries = movie.country?.map((c) => c.name).join(', ') || 'Đang cập nhật';
  const categories = movie.category?.map((c) => c.name).join(', ') || 'Đang cập nhật';
  const directorNames = movie.directors?.length > 0
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
}
