import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * @file TrailerModal.js
 * @description Universal cinematic trailer video modal player supporting direct YouTube IDs,
 * YouTube URLs, Dailymotion, TMDB automatic lookup, and graceful fallback actions.
 *
 * @param {Object} props
 * @param {Object|null} props.movie - Movie object to play trailer for. If null, modal is closed.
 * @param {Function} props.onClose - Callback invoked when the modal is closed.
 */
export default function TrailerModal({ movie, onClose }) {
  const [trailerEmbedUrl, setTrailerEmbedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fallbackSearchUrl, setFallbackSearchUrl] = useState('');

  // Extract clean movie attributes safely
  const movieTitle = movie?.title || movie?.name || movie?.origin_name || 'Trailer Phim';
  const originTitle = movie?.origin_name && movie?.origin_name !== movieTitle ? movie?.origin_name : '';
  const movieSlug = movie?.slug || '';
  const movieYear = movie?.year || '';
  const moviePoster = movie?.backdrop_url || movie?.poster_url || movie?.thumb_url || '';
  const movieQuality = movie?.quality || 'HD';

  useEffect(() => {
    if (!movie) {
      setTrailerEmbedUrl('');
      setLoading(false);
      setFallbackSearchUrl('');
      return;
    }

    let isSubscribed = true;

    // Handle ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Helper to extract YouTube video ID from various formats
    const extractYouTubeId = (str) => {
      if (!str || typeof str !== 'string') return null;
      const clean = str.trim();
      // Pure 11-char ID like "Way9Dexny3w"
      if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return clean;
      }
      // Standard YouTube link patterns
      const match = clean.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
      );
      return match ? match[1] : null;
    };

    // 1. Direct trailer URL provided in movie object
    const rawTrailer = movie.trailer_url || movie.trailerUrl || movie.trailer || movie.video_url;
    if (rawTrailer) {
      const ytId = extractYouTubeId(rawTrailer);
      if (ytId) {
        setTrailerEmbedUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`);
        setLoading(false);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }

      // Check if it's already an embed link (e.g. Dailymotion embed or Vimeo)
      if (typeof rawTrailer === 'string' && rawTrailer.includes('embed')) {
        const separator = rawTrailer.includes('?') ? '&' : '?';
        setTrailerEmbedUrl(`${rawTrailer}${separator}autoplay=1`);
        setLoading(false);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    }

    // 2. Automatic lookup via TMDB API if key is available
    setLoading(true);
    setTrailerEmbedUrl('');
    const youtubeSearchQuery = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      (originTitle || movieTitle) + ' official trailer'
    )}`;
    setFallbackSearchUrl(youtubeSearchQuery);

    const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '5739ebb7d66fa1dd775f806325ab4067';
    const searchQuery = encodeURIComponent(originTitle || movieTitle);

    const fetchTrailerFromTMDB = async () => {
      try {
        // Search movie on TMDB
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&api_key=${tmdbApiKey}&include_adult=false`
        );
        if (!searchRes.ok) throw new Error('TMDB Search failed');
        const searchData = await searchRes.json();

        let tmdbId = searchData.results?.[0]?.id;

        // If not found in movies, check TV series
        if (!tmdbId && movie?.type === 'series') {
          const tvRes = await fetch(
            `https://api.themoviedb.org/3/search/tv?query=${searchQuery}&api_key=${tmdbApiKey}&include_adult=false`
          );
          if (tvRes.ok) {
            const tvData = await tvRes.json();
            tmdbId = tvData.results?.[0]?.id;
            if (tmdbId) {
              const tvVideosRes = await fetch(
                `https://api.themoviedb.org/3/tv/${tmdbId}/videos?api_key=${tmdbApiKey}`
              );
              if (tvVideosRes.ok) {
                const tvVideos = await tvVideosRes.json();
                const trailer =
                  tvVideos.results?.find(
                    (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
                  ) || tvVideos.results?.[0];
                if (trailer?.key && isSubscribed) {
                  setTrailerEmbedUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }

        if (tmdbId) {
          const videosRes = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbApiKey}`
          );
          if (videosRes.ok) {
            const videoData = await videosRes.json();
            const trailer =
              videoData.results?.find(
                (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
              ) || videoData.results?.[0];

            if (trailer?.key && isSubscribed) {
              setTrailerEmbedUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`);
              setLoading(false);
              return;
            }
          }
        }

        // 3. Backup: search Dailymotion if TMDB yields no trailer
        const dmRes = await fetch(
          `https://api.dailymotion.com/videos?fields=id,title&search=${encodeURIComponent(
            movieTitle + ' trailer'
          )}&limit=1`
        );
        if (dmRes.ok) {
          const dmData = await dmRes.json();
          if (dmData.list && dmData.list.length > 0 && isSubscribed) {
            const dmId = dmData.list[0].id;
            setTrailerEmbedUrl(`https://www.dailymotion.com/embed/video/${dmId}?autoplay=1`);
            setLoading(false);
            return;
          }
        }

        // 4. Default: No direct embed found, show elegant fallback stage
        if (isSubscribed) {
          setLoading(false);
        }
      } catch (err) {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchTrailerFromTMDB();

    return () => {
      isSubscribed = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie, onClose, movieTitle, originTitle]);

  if (!movie) return null;

  return (
    <div
      className="modal-backdrop-overlay"
      onClick={(e) => {
        if (e.target.classList.contains('modal-backdrop-overlay')) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer phim ${movieTitle}`}
    >
      <div className="trailer-modal-box">
        {/* Modal Header */}
        <div className="trailer-modal-header">
          <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden me-2">
            <span className="trailer-badge">TRAILER</span>
            <div className="d-flex flex-column overflow-hidden">
              <h3 className="trailer-movie-title mb-0" title={movieTitle}>
                {movieTitle}
              </h3>
              {originTitle && (
                <span className="trailer-movie-subtitle" title={originTitle}>
                  {originTitle}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="trailer-close-btn"
            onClick={onClose}
            aria-label="Đóng trailer"
            title="Đóng (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Video Player Area */}
        <div className="trailer-video-wrap">
          {loading ? (
            <div className="trailer-loading-state">
              <div className="trailer-spinner" />
              <p className="mt-3 text-white-50">Đang tìm trailer phim...</p>
            </div>
          ) : trailerEmbedUrl ? (
            <iframe
              src={trailerEmbedUrl}
              title={`Trailer phim ${movieTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="trailer-iframe"
            />
          ) : (
            /* Modern Fallback Stage when no direct embed is available */
            <div className="trailer-fallback-stage">
              {moviePoster && (
                <img
                  src={moviePoster}
                  alt={movieTitle}
                  className="fallback-backdrop-blur"
                />
              )}
              <div className="fallback-dark-mask" />

              <div className="fallback-content-card">
                <div className="fallback-icon-circle">
                  <i className="fas fa-film text-danger" />
                </div>
                <h4 className="fallback-heading">Xem Trailer: {movieTitle}</h4>
                <p className="fallback-subtext">
                  Trailer chính thức chưa được nhúng trực tiếp. Bạn có thể mở xem trực tiếp trên YouTube
                  hoặc thưởng thức phim ngay tại trang chi tiết.
                </p>

                <div className="d-flex align-items-center justify-content-center gap-2 mt-3 flex-wrap">
                  {fallbackSearchUrl && (
                    <a
                      href={fallbackSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-youtube-open"
                    >
                      <i className="fab fa-youtube" />
                      <span>Xem trên YouTube ↗</span>
                    </a>
                  )}
                  {movieSlug && (
                    <Link
                      href={`/movie/${movieSlug}`}
                      className="btn-watch-movie"
                      onClick={onClose}
                    >
                      <span>Vào xem phim ngay</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="trailer-modal-footer">
          <div className="d-flex align-items-center gap-2">
            {movieYear && <span className="trailer-meta-tag">{movieYear}</span>}
            {movieQuality && <span className="trailer-meta-tag">{movieQuality}</span>}
          </div>

          {movieSlug && (
            <Link
              href={`/movie/${movieSlug}`}
              className="trailer-footer-link"
              onClick={onClose}
            >
              <span>Xem phim</span>
              <span className="arrow">→</span>
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 16px;
          animation: modalFadeIn 0.22s ease-out;
        }

        .trailer-modal-box {
          background: #0d1117;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          width: 100%;
          max-width: 920px;
          overflow: hidden;
          box-shadow: 0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(229, 9, 20, 0.2);
          animation: modalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trailer-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          background: #090c10;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .trailer-badge {
          background: #e50914;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(229, 9, 20, 0.5);
          flex-shrink: 0;
        }

        .trailer-movie-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trailer-movie-subtitle {
          font-size: 0.78rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trailer-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .trailer-close-btn:hover {
          background: #e50914;
          border-color: #e50914;
          color: #ffffff;
          transform: scale(1.08);
        }

        .trailer-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000000;
          overflow: hidden;
        }

        .trailer-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .trailer-loading-state {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #06080c;
        }

        .trailer-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(229, 9, 20, 0.2);
          border-top-color: #e50914;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Fallback Stage */
        .trailer-fallback-stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24px;
        }

        .fallback-backdrop-blur {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(16px) brightness(0.35);
          transform: scale(1.08);
        }

        .fallback-dark-mask {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(13, 17, 23, 0.6) 0%, rgba(13, 17, 23, 0.95) 100%);
        }

        .fallback-content-card {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 520px;
          padding: 24px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
        }

        .fallback-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.3);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 12px;
        }

        .fallback-heading {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .fallback-subtext {
          font-size: 0.82rem;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 0;
        }

        .btn-youtube-open {
          background: #e50914;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(229, 9, 20, 0.45);
        }

        .btn-youtube-open:hover {
          background: #f40612;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(229, 9, 20, 0.6);
        }

        .btn-watch-movie {
          background: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-watch-movie:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          transform: translateY(-2px);
        }

        .trailer-modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 18px;
          background: #090c10;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .trailer-meta-tag {
          font-size: 0.72rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .trailer-footer-link {
          font-size: 0.82rem;
          color: #38bdf8;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .trailer-footer-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .trailer-footer-link .arrow {
          transition: transform 0.2s ease;
        }

        .trailer-footer-link:hover .arrow {
          transform: translateX(3px);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 576px) {
          .trailer-movie-title {
            font-size: 0.95rem;
          }
          .trailer-modal-header {
            padding: 10px 14px;
          }
          .trailer-modal-footer {
            padding: 8px 14px;
          }
        }
      `}</style>
    </div>
  );
}
