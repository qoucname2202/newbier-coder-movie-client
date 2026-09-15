import React, { useState, useEffect } from 'react';

/**
 * @file TrailerModal.js
 * @description Standalone cinematic trailer video modal player supporting YouTube and Dailymotion embeds.
 *
 * @param {Object} props
 * @param {Object|null} props.movie - Movie object to play trailer for. If null, modal is closed.
 * @param {Function} props.onClose - Callback invoked when the modal is closed.
 */
export default function TrailerModal({ movie, onClose }) {
  const [trailerUrl, setTrailerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!movie) {
      setTrailerUrl('');
      setErrorMsg('');
      return;
    }

    // Handle ESC key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // If movie already provides a direct trailer URL
    if (movie.trailer_url) {
      let embed = movie.trailer_url;
      if (embed.includes('youtube.com/watch?v=')) {
        const id = embed.split('v=')[1]?.split('&')[0];
        embed = `https://www.youtube.com/embed/${id}?autoplay=1`;
      } else if (embed.includes('youtu.be/')) {
        const id = embed.split('youtu.be/')[1]?.split('?')[0];
        embed = `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      setTrailerUrl(embed);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }

    // Otherwise, search Dailymotion for trailer video
    setLoading(true);
    setErrorMsg('');
    const searchQuery = encodeURIComponent(`${movie.name} official trailer`);

    fetch(`https://api.dailymotion.com/videos?fields=id,title&search=${searchQuery}&limit=1`)
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        if (data.list && data.list.length > 0) {
          const videoId = data.list[0].id;
          setTrailerUrl(`https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`);
        } else {
          // Fallback search
          setTrailerUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.name + ' trailer')}&autoplay=1`);
        }
      })
      .catch(() => {
        setTrailerUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.name + ' trailer')}&autoplay=1`);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie, onClose]);

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
      aria-label={`Trailer phim ${movie.name}`}
    >
      <div className="trailer-modal-box">
        {/* Modal Header */}
        <div className="trailer-modal-header">
          <div className="d-flex align-items-center gap-2">
            <span className="trailer-badge">TRAILER</span>
            <h3 className="trailer-movie-title mb-0">{movie.name}</h3>
          </div>
          <button
            type="button"
            className="trailer-close-btn"
            onClick={onClose}
            aria-label="Đóng trailer"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="trailer-video-wrap">
          {loading ? (
            <div className="trailer-loading-state">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="mt-3 text-white-50">Đang tìm trailer phim...</p>
            </div>
          ) : trailerUrl ? (
            <iframe
              src={trailerUrl}
              title={`Trailer phim ${movie.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="trailer-iframe"
            />
          ) : (
            <div className="trailer-loading-state">
              <p className="text-white-50">{errorMsg || 'Không tìm thấy trailer cho phim này.'}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 16px;
          animation: modalFadeIn 0.25s ease-out;
        }

        .trailer-modal-box {
          background: #12151b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          width: 100%;
          max-width: 920px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(229, 9, 20, 0.15);
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trailer-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #0d1015;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .trailer-badge {
          background: #e50914;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .trailer-movie-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 600px;
        }

        .trailer-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #ffffff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          transition: all 0.2s ease;
        }

        .trailer-close-btn:hover {
          background: #e50914;
          transform: scale(1.05);
        }

        .trailer-video-wrap {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          overflow: hidden;
          background: #000000;
        }

        .trailer-iframe {
          position: absolute;
          top: 0;
          left: 0;
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
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 576px) {
          .trailer-movie-title {
            max-width: 200px;
            font-size: 0.95rem;
          }
          .trailer-modal-header {
            padding: 10px 14px;
          }
        }
      `}</style>
    </div>
  );
}
