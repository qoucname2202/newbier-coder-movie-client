import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  resolveMovieBackdrop,
  resolveMovieCategories,
  resolveMovieYear
} from '@/utils/movieNormalizer';
import {
  resolveMovieTrailer,
  buildMovieTrailerSearchLink,
  type TrailerResolution
} from '@/utils/trailer';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import { formatYear, getTaxonomyName } from '@/utils/taxonomy';
import styles from './TrailerModal.module.css';

/**
 * @file TrailerModal.tsx
 * @description Cinematic trailer modal that embeds the movie's YouTube
 * trailer (or a fallback panel when the trailer is missing) directly in
 * a YouTube iframe.
 *
 * All trailer validation and ID extraction is delegated to
 * `@/utils/trailer`. The modal just decides which of three states to
 * render: `player` (have an embed URL), `missing` (no trailer payload),
 * or `broken` (the user manually marked the trailer as unplayable).
 *
 * Closing the modal unmounts the iframe, which stops YouTube playback
 * (the browser tears down the YouTube player when the iframe is removed
 * from the DOM).
 */

interface CategoryEntry {
  slug?: string;
  name?: string;
}

export type TrailerObject = import('@/utils/trailer').TrailerObject;

export interface TrailerMovie {
  _id?: string;
  slug?: string;
  title?: string;
  name?: string;
  origin_name?: string;
  description?: string;
  content?: string;
  overview?: string;
  synopsis?: string;
  duration?: number | string;
  runtime?: number | string;
  episode_time?: number | string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  year?: number | string;
  category?: CategoryEntry[];

  // Legacy flat trailer URL fields
  trailer_url?: string;
  trailerUrl?: string;
  video_url?: string;
  videoUrl?: string;
  trailerLink?: string;

  // Object-shaped trailer payload (TMDB-style, backend-crawl, etc.)
  trailer?: TrailerObject | string;
  video?: TrailerObject | string;
  youtube?: TrailerObject | string;
  youtube_trailer?: TrailerObject | string;
  movie_trailer?: TrailerObject | string;

  // For nested responseData structure (sometimes backend wraps movie in { movie: {...} })
  movie?: TrailerMovie;
  data?: TrailerMovie;
  [key: string]: unknown;
}

export interface TrailerModalProps {
  movie: TrailerMovie | null;
  onClose: () => void;
}

interface MetaInfo {
  title: string;
  originTitle: string;
  backdrop: string;
  poster: string;
  year: number | string | null;
  categories: CategoryEntry[];
  description: string;
  duration: number | string | null;
}

/** Localized banner copy for the "no trailer" panel. */
const NO_TRAILER_COPY: Record<string, { heading: string; sub: string }> = {
  'invalid-id': {
    heading: 'Trailer không khả dụng',
    sub: 'Liên kết trailer của phim không hợp lệ hoặc đã bị xóa trên YouTube.',
  },
  'unsupported-provider': {
    heading: 'Trailer không thể nhúng tại đây',
    sub: 'Trailer của phim này đến từ một nhà cung cấp video mà chúng tôi không hỗ trợ nhúng. Bạn có thể tìm trailer chính thức trên YouTube bên dưới.',
  },
  'no-data': {
    heading: 'Chưa có thông tin phim',
    sub: 'Không thể tải thông tin phim để phát trailer.',
  },
  'no-trailer': {
    heading: 'Trailer chưa được cung cấp',
    sub: 'Trailer của phim này hiện chưa được cập nhật. Vui lòng chọn server bên dưới để xem phim.',
  },
};

const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  // Re-resolve the trailer whenever the active movie changes.
  const resolution: TrailerResolution = useMemo(
    () =>
      movie
        ? resolveMovieTrailer(movie)
        : { available: false, provider: null, embedUrl: '', reason: 'no-data' },
    [movie]
  );

  // Temporary diagnostic log (gated by NEXT_PUBLIC_DEBUG_MOVIES) so
  // operators can see exactly which trailer fields reach the modal and
  // how the resolver classified the payload. Safe: no PII, no tokens.
  useEffect(() => {
    if (!SYSTEM_CONFIG.debugMovies) return;
    if (!movie) return;
  }, [movie, resolution]);

  const embedUrl = resolution.embedUrl;
  const fallbackCopy = NO_TRAILER_COPY[resolution.reason] || NO_TRAILER_COPY['no-trailer'];

  // Whether the iframe has fired its `onLoad` event at least once.
  const [iframeReady, setIframeReady] = useState<boolean>(false);
  // Whether the user has manually marked the trailer as unplayable.
  // We never flip this automatically based on a timeout (a slow network
  // is not evidence of a region block).
  const [userMarkedBroken, setUserMarkedBroken] = useState<boolean>(false);
  // Incremented on every "Retry" click to force-remount the iframe.
  const [retryNonce, setRetryNonce] = useState<number>(0);
  // Advisory copy after 30s of waiting — does NOT change the state.
  const [slowNetworkHint, setSlowNetworkHint] = useState<boolean>(false);

  // Reset transient state whenever the movie changes.
  useEffect(() => {
    setIframeReady(false);
    setUserMarkedBroken(false);
    setRetryNonce((n) => n + 1);
    setSlowNetworkHint(false);
  }, [movie]);

  // Escape-to-close (stable callback ref avoids re-binding on every render).
  const onCloseRef = useRef<() => void>(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Three-way display state derived from the resolution.
  const display: 'player' | 'missing' | 'broken' = useMemo(() => {
    if (!embedUrl) return 'missing';
    if (userMarkedBroken) return 'broken';
    return 'player';
  }, [embedUrl, userMarkedBroken]);

  // After 30s of waiting on the same trailer URL, show the slow-network
  // hint. Never flips `display`.
  useEffect(() => {
    if (display !== 'player' || iframeReady) {
      setSlowNetworkHint(false);
      return undefined;
    }
    const t = window.setTimeout(() => setSlowNetworkHint(true), 30_000);
    return () => window.clearTimeout(t);
  }, [display, iframeReady, retryNonce]);

  const handleIframeLoad = useCallback((): void => {
    setIframeReady(true);
  }, []);

  const handleRetry = useCallback((): void => {
    setUserMarkedBroken(false);
    setIframeReady(false);
    setRetryNonce((n) => n + 1);
  }, []);

  // Build the metadata panel payload (also used for the backdrop image
  // inside the fallback stage).
  const meta = useMemo<MetaInfo | null>(() => {
    if (!movie) return null;
    const title = movie.title || movie.name || movie.origin_name || 'Trailer Phim';
    const originTitle =
      movie.origin_name && movie.origin_name !== title ? movie.origin_name : '';
    const backdrop = resolveMovieBackdrop(movie as never) || '';
    const poster = movie.poster_url || movie.thumb_url || backdrop;
    const year = resolveMovieYear(movie as never);
    const categories = resolveMovieCategories(movie as never) || [];
    const description =
      movie.description ||
      movie.content ||
      movie.overview ||
      movie.synopsis ||
      '';
    const duration = movie.duration || movie.runtime || movie.episode_time || null;
    return { title, originTitle, backdrop, poster, year, categories, description, duration };
  }, [movie]);

  // Convert the embed URL into a plain `watch?v=...` link so the
  // "Open on YouTube" button works even after the iframe is gone.
  const watchUrl = useMemo(() => {
    if (!embedUrl) return '';
    try {
      const url = new URL(embedUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx + 1]) {
        return `https://www.youtube.com/watch?v=${parts[idx + 1]}`;
      }
    } catch {
      /* fall through */
    }
    return embedUrl.replace('/embed/', '/watch?v=');
  }, [embedUrl]);

  if (!movie || !meta) return null;

  const searchUrl = buildMovieTrailerSearchLink(movie);

  return (
    <div
      className={styles.modalBackdropOverlay}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains(styles.modalBackdropOverlay)) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer phim ${meta.title}`}
    >
      <div className={styles.trailerModalBox}>
        {/* Close Button */}
        <button
          type="button"
          className={styles.trailerCloseBtn}
          onClick={onClose}
          aria-label="Đóng trailer"
          title="Đóng (Esc)"
        >
          <i className="fas fa-times" />
        </button>

        {/* Video Slot */}
        <div className={styles.trailerVideoWrap}>
          {display === 'player' && (
            <>
              <iframe
                key={`player-${retryNonce}`}
                src={embedUrl}
                title={`Trailer phim ${meta.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.trailerIframe}
                onLoad={handleIframeLoad}
              />
              {!iframeReady && (
                <div className={styles.trailerLoadingOverlay} role="status" aria-live="polite">
                  <div className={styles.trailerSpinner} />
                  <span className={styles.trailerLoadingText}>
                    {slowNetworkHint
                      ? 'Đang tải chậm, vui lòng chờ hoặc bấm "Báo lỗi trailer" bên dưới.'
                      : 'Đang tải trailer…'}
                  </span>
                </div>
              )}
            </>
          )}

          {display === 'broken' && (
            <FallbackPanel
              title={meta.title}
              backdrop={meta.backdrop}
              heading="Trailer tạm thời không phát được"
              sub="Trình phát YouTube không thể tải video này. Video có thể đã bị gỡ hoặc bị chặn nhúng tại khu vực của bạn. Bạn có thể thử lại hoặc mở trực tiếp trên YouTube."
              iconClass="fas fa-exclamation-triangle text-danger"
            />
          )}

          {display === 'missing' && (
            <FallbackPanel
              title={meta.title}
              backdrop={meta.backdrop}
              heading={fallbackCopy.heading}
              sub={fallbackCopy.sub}
              iconClass="fas fa-film text-danger"
            />
          )}
        </div>

        {/* Movie Metadata Panel */}
        <div className={styles.trailerMetaPanel}>
          <div className={styles.trailerMetaPoster}>
            {meta.poster && (
              <img
                src={meta.poster}
                alt={meta.title}
                className={styles.trailerMetaPosterImg}
                loading="lazy"
              />
            )}
          </div>

          <div className={styles.trailerMetaBody}>
            <h3 className={styles.trailerMetaTitle}>{meta.title}</h3>
            {meta.originTitle && (
              <p className={styles.trailerMetaOrigin}>{meta.originTitle}</p>
            )}

            <div className={styles.trailerMetaTags}>
              {meta.year && <span className={styles.trailerMetaTag}>{formatYear(meta.year)}</span>}
              {Array.isArray(meta.categories) &&
                meta.categories.slice(0, 3).map((cat, idx) => {
                  const catName = getTaxonomyName(cat);
                  if (!catName) return null;
                  return (
                    <span key={cat?.slug || catName || String(idx)} className={styles.trailerMetaTag}>
                      {catName}
                    </span>
                  );
                })}
              {meta.duration && (
                <span className={styles.trailerMetaTag}>{meta.duration} phút</span>
              )}
            </div>

            {meta.description && (
              <p className={styles.trailerMetaDescription}>{meta.description}</p>
            )}

            <div className={styles.trailerMetaActions}>
              <button
                type="button"
                className={`${styles.trailerActionBtn} ${styles['trailerActionBtn--search']}`}
                onClick={() => {
                  if (!searchUrl || searchUrl === 'https://www.youtube.com/') return;
                  window.open(searchUrl, '_blank', 'noopener,noreferrer');
                }}
                title="Mở YouTube search cho trailer này"
              >
                <i className="fab fa-youtube" /> Tìm trên YouTube
              </button>
              {watchUrl && (
                <a
                  className={`${styles.trailerActionBtn} ${styles['trailerActionBtn--open']}`}
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Mở trực tiếp trên YouTube"
                >
                  <i className="fas fa-external-link-alt" /> Mở trên YouTube
                </a>
              )}
              {display === 'broken' ? (
                <button
                  type="button"
                  className={`${styles.trailerActionBtn} ${styles['trailerActionBtn--retry']}`}
                  onClick={handleRetry}
                  title="Thử lại trailer"
                >
                  <i className="fas fa-redo" /> Thử lại
                </button>
              ) : slowNetworkHint ? (
                <button
                  type="button"
                  className={`${styles.trailerActionBtn} ${styles['trailerActionBtn--report']}`}
                  onClick={() => setUserMarkedBroken(true)}
                  title="Trailer không phát được sau 30 giây"
                >
                  <i className="fas fa-flag" /> Báo lỗi trailer
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Small inline panel shown when the trailer can't be played. */
const FallbackPanel: React.FC<{
  title: string;
  backdrop: string;
  heading: string;
  sub: string;
  iconClass: string;
}> = ({ title, backdrop, heading, sub, iconClass }) => (
  <div className={styles.trailerFallbackStage}>
    {backdrop && <img src={backdrop} alt={title} className={styles.fallbackBackdropBlur} />}
    <div className={styles.fallbackDarkMask} />
    <div className={styles.fallbackContentCard}>
      <div className={styles.fallbackIconCircle}>
        <i className={iconClass} />
      </div>
      <h4 className={styles.fallbackHeading}>{heading}</h4>
      <p className={styles.fallbackSubtext}>{sub}</p>
    </div>
  </div>
);

export default TrailerModal;
