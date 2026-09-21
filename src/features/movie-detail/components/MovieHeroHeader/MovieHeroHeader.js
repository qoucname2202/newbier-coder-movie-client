import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LOCAL_DEFAULT_BACKDROP, LOCAL_DEFAULT_POSTER } from '@/config/movieConfig';
import styles from './MovieHeroHeader.module.css';

/**
 * @file MovieHeroHeader.js
 * @description Cinema widescreen 21:9 backdrop stage with floating poster,
 * prominent technical badges, title hierarchy, and quick action bar.
 *
 * @param {Object} props
 * @param {Object} props.movie - Normalized movie detail object.
 * @param {Function} [props.onPlayNow] - Callback to start watching.
 * @param {Function} [props.onPlayTrailer] - Callback to open trailer modal.
 * @param {boolean} [props.isFavorite=false] - Favorite status.
 * @param {Function} [props.onToggleFavorite] - Toggle favorite callback.
 */
export default function MovieHeroHeader({
  movie,
  onPlayNow,
  onPlayTrailer,
  isFavorite = false,
  onToggleFavorite
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);


  if (!movie) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const categories = movie.category || [];
  const ratingVal = movie.rating ? Number(movie.rating).toFixed(1) : '8.6';

  return (
    <section className={styles.heroBackdropSection} aria-label="Khung cảnh tiêu điểm phim">
      {/* Background Media with multi-layer Cinema Vignette */}
      <img
        src={movie.backdrop_url || LOCAL_DEFAULT_BACKDROP}
        alt={movie.name}
        className={styles.backdropBg}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = LOCAL_DEFAULT_BACKDROP;
        }}
      />
      <div className={styles.backdropOverlay} />

      {/* Main Two-Column Stage Container */}
      <div className={styles.heroContentContainer}>
        {/* Left Column: Floating 2:3 Poster Card */}
        <div className={styles.posterBox}>
          <img
            src={movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER}
            alt={movie.name}
            className={styles.posterImg}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = LOCAL_DEFAULT_POSTER;
            }}
          />

          <div className={styles.posterBadges}>
            <span className={styles.ratingTag}>
              <i className="fas fa-star" />
              {ratingVal}
            </span>
            <span className={styles.qualityTag}>{movie.quality || 'FHD'}</span>
          </div>
        </div>

        {/* Right Column: Title, Metadata, Categories, Action Bar */}
        <div className={styles.infoColumn}>
          {/* Row 1: Technical & Production Badges */}
          <div className={styles.techBadgesRow}>
            {movie.year && (
              <span className={styles.techBadge}>
                <i className="fas fa-calendar-alt me-1" />
                {movie.year}
              </span>
            )}
            {movie.time && (
              <span className={styles.techBadge}>
                <i className="fas fa-clock me-1" />
                {movie.time}
              </span>
            )}
            <span className={styles.techBadge}>
              <i className="fas fa-film me-1" />
              {movie.type === 'series' ? 'Phim Bộ' : 'Phim Lẻ'}
            </span>
            {movie.status && (
              <span className={`${styles.techBadge} ${styles.statusBadge}`}>
                {movie.status === 'ongoing' ? 'Đang Chiếu' : (movie.status === 'upcoming' ? 'Sắp Chiếu' : 'Hoàn Thành')}
              </span>
            )}
            {movie.lang && (
              <span className={`${styles.techBadge} ${styles.langBadge}`}>
                {movie.lang}
              </span>
            )}
          </div>

          {/* Row 2: Titles */}
          <div className={styles.titleBox}>
            <h1 className={styles.movieTitle}>{movie.name}</h1>
            <h2 className={styles.movieSubTitle}>{movie.origin_name}</h2>
          </div>

          {/* Row 3: Category Pills */}
          {categories.length > 0 && (
            <div className={styles.categoryPills}>
              {categories.map((cat, idx) => (
                <Link
                  key={cat.slug || idx}
                  href={`/search?category=${encodeURIComponent(cat.slug || '')}`}
                  className={styles.pill}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Row 4: Quick Action Bar */}
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.btnPlayNow}
              onClick={() => {
                if (onPlayNow) {
                  onPlayNow();
                } else if (movie?.slug) {
                  router.push(`/movie/${movie.slug}/watch`);
                }
              }}
              id="btn-movie-play-now"
            >
              <i className="fas fa-play" />
              <span>Xem Phim Ngay</span>
            </button>

            {onPlayTrailer && (
              <button
                type="button"
                className={styles.btnTrailer}
                onClick={() => onPlayTrailer(movie)}
                id="btn-movie-trailer"
              >
                <i className="fas fa-film text-danger" />
                <span>Xem Trailer</span>
              </button>
            )}

            {onToggleFavorite && (
              <button
                type="button"
                className={`${styles.btnCircleAction} ${isFavorite ? styles.btnFavoriteActive : ''}`}
                onClick={onToggleFavorite}
                title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                aria-label="Yêu thích phim"
              >
                <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} />
              </button>
            )}

            <button
              type="button"
              className={styles.btnCircleAction}
              onClick={handleShare}
              title={copied ? 'Đã sao chép link!' : 'Chia sẻ phim'}
              aria-label="Chia sẻ phim"
            >
              <i className={copied ? 'fas fa-check text-success' : 'fas fa-share-alt'} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
