import React, { useState } from 'react';
import {
  resolveMovieTrailer,
  buildMovieTrailerSearchLink,
  type TrailerResolution
} from '@/utils/trailer';
import { pickImageSrc, BACKDROP_FIELDS} from '@/utils/imageSource';
import { LOCAL_DEFAULT_BACKDROP, LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import styles from './InlineTrailerSection.module.css';

/**
 * @file InlineTrailerSection.tsx
 * @description Dedicated inline cinema trailer preview section. Enables smooth
 * inline video playback or launches the full-screen cinematic TrailerModal.
 */

export interface InlineTrailerMovie {
  _id?: string;
  name?: string;
  origin_name?: string;
  year?: number | string;
  trailer_url?: string;
  trailer?: unknown;
  video_url?: string;
  backdrop_url?: string;
  poster_url?: string;
  thumb_url?: string;
  [key: string]: unknown;
}

export interface InlineTrailerSectionProps {
  movie?: InlineTrailerMovie | null;
  onOpenModal?: (movie: InlineTrailerMovie) => void;
}

export const InlineTrailerSection: React.FC<InlineTrailerSectionProps> = ({
  movie,
  onOpenModal
}) => {
  const [isInlinePlaying, setIsInlinePlaying] = useState<boolean>(false);

  if (!movie) return null;

  // Resolve trailer through the centralized trailer utility
  const trailerRes: TrailerResolution = resolveMovieTrailer(movie as never);
  const hasTrailer = trailerRes.available && Boolean(trailerRes.embedUrl);

  const backdropSrc = pickImageSrc(
    movie as Record<string, unknown>,
    BACKDROP_FIELDS,
    LOCAL_DEFAULT_BACKDROP
  );

  const youtubeSearchUrl = buildMovieTrailerSearchLink(movie as never);

  const handleStartInlinePlay = (): void => {
    if (hasTrailer) {
      setIsInlinePlaying(true);
    }
  };

  const handleFullscreenModal = (): void => {
    if (onOpenModal) {
      onOpenModal(movie);
    }
  };

  return (
    <section className={styles.sectionWrapper} aria-label="Trailer & Teaser phim">
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <i className="fas fa-video text-danger me-2" />
          <h3 className={styles.sectionTitle}>Trailer & Teaser Chính Thức</h3>
        </div>
        {hasTrailer && (
          <button
            type="button"
            className={styles.btnLaunchModal}
            onClick={handleFullscreenModal}
            title="Mở trailer chế độ rạp chiếu"
          >
            <i className="fas fa-expand me-1" />
            <span>Xem Toàn Màn Hình</span>
          </button>
        )}
      </div>

      <div className={styles.playerCard}>
        {hasTrailer ? (
          isInlinePlaying ? (
            <div className={styles.responsiveIframeWrap}>
              <iframe
                src={`${trailerRes.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
                title={`Trailer ${movie.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className={styles.trailerIframe}
              />
            </div>
          ) : (
            <div className={styles.posterCover} onClick={handleStartInlinePlay}>
              <img
                src={backdropSrc}
                alt={`Trailer ${movie.name}`}
                className={styles.backdropCoverImg}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = LOCAL_DEFAULT_POSTER;
                }}
              />
              <div className={styles.coverOverlay} />

              {/* Floating Meta Badges */}
              <div className={styles.floatingBadges}>
                <span className={styles.badgeOfficial}>Official Trailer</span>
                <span className={styles.badgeQuality}>1080p HD</span>
              </div>

              {/* Pulsing Play Button */}
              <div className={styles.playActionCenter}>
                <div className={styles.playButtonPulse}>
                  <i className="fas fa-play" />
                </div>
                <span className={styles.playPromptText}>Nhấn để xem Trailer</span>
              </div>

              <div className={styles.bottomInfoBar}>
                <div className={styles.movieNames}>
                  <h4 className={styles.trailerMovieTitle}>{movie.name}</h4>
                  {movie.origin_name && (
                    <span className={styles.trailerOriginTitle}>{movie.origin_name}</span>
                  )}
                </div>
                <div className={styles.actionButtonsInline}>
                  <button
                    type="button"
                    className={styles.btnWatchTrailerNow}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartInlinePlay();
                    }}
                  >
                    <i className="fas fa-play me-1" />
                    Phát Ngay
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className={styles.noTrailerFallback}>
            <div className={styles.fallbackIcon}>
              <i className="fas fa-film text-secondary" />
            </div>
            <div className={styles.fallbackContent}>
              <h4 className={styles.fallbackTitle}>Trailer đang được cập nhật</h4>
              <p className={styles.fallbackDesc}>
                Trailer chính thức của bộ phim &ldquo;{movie.name}&rdquo; đang được đồng bộ hóa từ hệ thống nhà phát hành. Bạn có thể tra cứu nhanh trailer trên YouTube.
              </p>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnSearchYoutube}
              >
                <i className="fab fa-youtube text-danger me-2" />
                Tìm kiếm trailer trên YouTube
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InlineTrailerSection;
