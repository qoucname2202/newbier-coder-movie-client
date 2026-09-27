import React, { useState, useEffect } from 'react';
import { TMDB_CONFIG, YOUTUBE_CONFIG } from '@/config/systemConfig';

/**
 * @file TrailerModal.js
 * @description Pure cinematic trailer video modal player.
 * Streamlined per team review: removes redundant movie headers, footers,
 * and metadata tags, focusing 100% on the widescreen video player with
 * a floating exit button, backdrop-click, and ESC dismissal.
 *
 * @param {Object} props
 * @param {Object|null} props.movie - Movie object to play trailer for. If null, modal is closed.
 * @param {Function} props.onClose - Callback invoked when the modal is closed.
 */
export default function TrailerModal({ movie, onClose }) {
  const [trailerEmbedUrl, setTrailerEmbedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fallbackSearchUrl, setFallbackSearchUrl] = useState('');

  const movieTitle = movie?.title || movie?.name || movie?.origin_name || 'Trailer Phim';
  const originTitle = movie?.origin_name && movie?.origin_name !== movieTitle ? movie?.origin_name : '';
  const moviePoster = movie?.backdrop_url || movie?.poster_url || movie?.thumb_url || '';

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
        setTrailerEmbedUrl(YOUTUBE_CONFIG.getEmbedUrl(ytId));
        setLoading(false);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }

      // Check if it's already an embed link (e.g. Vimeo or custom player)
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

    const searchQuery = encodeURIComponent(originTitle || movieTitle);

    const fetchTrailerFromTMDB = async () => {
      try {
        // Search movie on TMDB
        const searchRes = await fetch(
          `${TMDB_CONFIG.baseUrl}/search/movie?query=${searchQuery}&api_key=${TMDB_CONFIG.apiKey}&include_adult=false`
        );
        if (!searchRes.ok) throw new Error('TMDB Search failed');
        const searchData = await searchRes.json();

        let tmdbId = searchData.results?.[0]?.id;

        // If not found in movies, check TV series
        if (!tmdbId && movie?.type === 'series') {
          const tvRes = await fetch(
            `${TMDB_CONFIG.baseUrl}/search/tv?query=${searchQuery}&api_key=${TMDB_CONFIG.apiKey}&include_adult=false`
          );
          if (tvRes.ok) {
            const tvData = await tvRes.json();
            tmdbId = tvData.results?.[0]?.id;
            if (tmdbId) {
              const tvVideosRes = await fetch(
                `${TMDB_CONFIG.baseUrl}/tv/${tmdbId}/videos?api_key=${TMDB_CONFIG.apiKey}`
              );
              if (tvVideosRes.ok) {
                const tvVideos = await tvVideosRes.json();
                const trailer =
                  tvVideos.results?.find(
                    (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
                  ) || tvVideos.results?.[0];
                if (trailer?.key && isSubscribed) {
                  setTrailerEmbedUrl(YOUTUBE_CONFIG.getEmbedUrl(trailer.key));
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }

        if (tmdbId) {
          const videosRes = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/${tmdbId}/videos?api_key=${TMDB_CONFIG.apiKey}`
          );
          if (videosRes.ok) {
            const videoData = await videosRes.json();
            const trailer =
              videoData.results?.find(
                (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
              ) || videoData.results?.[0];

            if (trailer?.key && isSubscribed) {
              setTrailerEmbedUrl(YOUTUBE_CONFIG.getEmbedUrl(trailer.key));
              setLoading(false);
              return;
            }
          }
        }

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
        {/* Sole Exit / Close Button */}
        <button
          type="button"
          className="trailer-close-btn"
          onClick={onClose}
          aria-label="Đóng trailer"
          title="Đóng (Esc)"
        >
          <i className="fas fa-times" />
        </button>

        {/* Pure 16:9 Video Player Area */}
        <div className="trailer-video-wrap">
          {loading ? (
            <div className="trailer-loading-state">
              <div className="trailer-spinner" />
              {/* <p className="mt-3 text-white-50">Đang tìm trailer phim...</p> */}
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
                  Trailer chưa thể phát trực tiếp tại đây. Bạn có thể mở xem trực tiếp trên YouTube.
                </p>

                {fallbackSearchUrl && (
                  <div className="mt-3">
                    <a
                      href={fallbackSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-youtube-open"
                    >
                      <i className="fab fa-youtube" />
                      <span>Xem trên YouTube ↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 24px 20px;
          animation: modalFadeIn 0.2s ease-out;
        }

        .trailer-modal-box {
          position: relative;
          width: 100%;
          max-width: 960px;
          animation: modalSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trailer-close-btn {
          position: absolute;
          top: -18px;
          right: -18px;
          z-index: 30;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #161b22;
          border: 2px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.05rem;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trailer-close-btn:hover {
          background: #e50914;
          border-color: #e50914;
          color: #ffffff;
          transform: scale(1.12);
        }

        .trailer-close-btn:active {
          transform: scale(0.96);
        }

        .trailer-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000000;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.75);
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

        @media (max-width: 768px) {
          .trailer-close-btn {
            top: 10px;
            right: 10px;
            width: 36px;
            height: 36px;
            font-size: 0.95rem;
            background: rgba(0, 0, 0, 0.7);
          }
        }
      `}</style>
    </div>
  );
}
