import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/common/MovieSection/SectionHeader';
import styles from './BigSlideBanner.module.css';

/**
 * @file BigSlideBanner.js
 * @description Cinematic widescreen anime spotlight banner.
 * Elevated height with minimal filter overlays to highlight vivid anime artwork.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.movies] - List of movies to showcase.
 * @param {Function} [props.onPlayTrailer] - Callback to open the trailer modal.
 * @param {string} [props.title="Tiêu Điểm Anime"] - Section header title.
 * @param {string} [props.badge="ANIME SPOTLIGHT"] - Top badge label.
 * @param {string} [props.viewAllHref="/the-loai/hoat-hinh"] - Link for view all.
 * @param {number} [props.autoPlayInterval=7000] - Duration per slide in ms.
 */
export default function BigSlideBanner({
  movies = [],
  onPlayTrailer,
  title = "Tiêu Điểm Anime",
  badge = "ANIME SPOTLIGHT",
  viewAllHref = "/the-loai/hoat-hinh",
  autoPlayInterval = 7000
}) {
  const displayMovies = Array.isArray(movies) ? movies : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const currentMovie = displayMovies[currentIndex] || displayMovies[0];

  // Auto-play logic with progress bar
  useEffect(() => {
    if (!displayMovies || displayMovies.length <= 1) return;

    if (isPaused) {
      clearInterval(timerRef.current);
      clearInterval(progressTimerRef.current);
      return;
    }

    setProgress(0);
    const intervalStep = 50;
    const totalSteps = autoPlayInterval / intervalStep;
    let currentStep = 0;

    progressTimerRef.current = setInterval(() => {
      currentStep += 1;
      setProgress((currentStep / totalSteps) * 100);
    }, intervalStep);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMovies.length);
      setProgress(0);
    }, autoPlayInterval);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, isPaused, displayMovies, autoPlayInterval]);

  const handleSelectSlide = (index) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  if (!currentMovie) return null;

  const movieRating = currentMovie.rating ? Number(currentMovie.rating).toFixed(1) : '8.5';
  const movieQuality = currentMovie.quality || '4K';
  const movieLang = currentMovie.lang || 'Vietsub';
  const movieYear = currentMovie.year || 2024;
  const movieTime = currentMovie.time || '120 phút';

  return (
    <section className={styles.bigSlideSection} aria-label="Tiêu Điểm Anime">
      {/* Section Header to easily identify this exclusive feature on homepage */}
      {title && (
        <SectionHeader
          title={title}
          badge="ĐỘC BẢN"
          viewAllHref={viewAllHref}
          viewAllText="Xem tất cả anime"
        />
      )}

      <div
        className={styles.bigSlideContainer}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.slideWrapper}>
          {/* Background Backdrop Image with bright, clean display */}
          <img
            key={currentMovie._id || currentMovie.slug}
            src={currentMovie.backdrop_url || currentMovie.poster_url || currentMovie.thumb_url}
            alt={currentMovie.name}
            className={styles.backdropImage}
          />

          {/* Minimalist, Gentle Gradient Overlay */}
          <div className={styles.overlayGradient} />

          {/* Minimalist Content Information */}
          <div className={styles.contentBox}>
            {badge && (
              <div className={styles.badgeHighlight}>
                <span>{badge}</span>
              </div>
            )}

            <h2 className={styles.title}>{currentMovie.name}</h2>

            {currentMovie.origin_name && (
              <div className={styles.originTitle}>{currentMovie.origin_name}</div>
            )}

            <div className={styles.metaRow}>
              <span className={styles.ratingText}>
                <i className="fas fa-star" /> {movieRating}
              </span>
              <span className={styles.metaDot}>•</span>
              <span>{movieYear}</span>
              <span className={styles.metaDot}>•</span>
              <span>{movieTime}</span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.qualityTag}>{movieQuality}</span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.langText}>{movieLang}</span>
            </div>

            <p className={styles.synopsis}>{currentMovie.content}</p>

            <div className={styles.actions}>
              <Link href={`/movie/${currentMovie.slug}`} className={styles.btnPlay}>
                <i className="fas fa-play" />
                <span>Xem phim</span>
              </Link>

              {onPlayTrailer && (
                <button
                  type="button"
                  className={styles.btnTrailer}
                  onClick={() => onPlayTrailer(currentMovie)}
                >
                  <i className="fas fa-film" />
                  <span>Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick-Switch Thumbnails Navigation */}
          {displayMovies.length > 1 && (
            <div className={styles.thumbnailsNav}>
              {displayMovies.slice(0, 5).map((movie, idx) => (
                <div
                  key={movie._id || movie.slug || idx}
                  className={`${styles.thumbItem} ${idx === currentIndex ? styles.thumbItemActive : ''}`}
                  onClick={() => handleSelectSlide(idx)}
                  title={movie.name}
                >
                  <img
                    src={movie.thumb_url || movie.poster_url}
                    alt={movie.name}
                    className={styles.thumbImg}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Auto-Slide Progress Bar */}
          <div
            className={styles.progressBar}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
