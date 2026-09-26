import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaHome, 
  FaArrowLeft, 
  FaSearch, 
  FaCompass,
  FaFire,
  FaTv
} from 'react-icons/fa';

/**
 * @file 404.js
 * @description Compact, artistic, and minimalist cinema-themed 404 page.
 * Elegantly sized with ample header margin to prevent any overlapping.
 */
export default function Custom404() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/search');
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const popularSuggestions = [
    { label: 'Phim Mới Cập Nhật', href: '/' },
    { label: 'Bảng Xếp Hạng', href: '/rankings' },
    { label: 'Phim Bộ Hot', href: '/series' },
    { label: 'Anime & Hoạt Hình', href: '/the-loai/hoat-hinh' },
    { label: 'K-Drama', href: '/quoc-gia/han-quoc' },
  ];

  return (
    <>
      <Head>
        <title>404 - Không Tìm Thấy Trang | MovieStreaming</title>
        <meta
          name="description"
          content="Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang trang khác."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="cinema-404-container">
        {/* Subtle Ambient Red Glow */}
        <div className="ambient-glow" aria-hidden="true" />

        {/* Minimalist Centered Content Card */}
        <div className="cinema-404-content">
          {/* Compact Artistic 404 with Spinning Film Reel */}
          <div className="artistic-404-display" aria-label="Lỗi 404">
            <span className="digit">4</span>
            <div className="reel-center-wrapper">
              <div className="film-reel-spinner">
                <div className="reel-outer-ring">
                  <div className="reel-spoke spoke-1" />
                  <div className="reel-spoke spoke-2" />
                  <div className="reel-spoke spoke-3" />
                  <div className="reel-spoke spoke-4" />
                  <div className="reel-core">
                    <span className="core-light" />
                  </div>
                </div>
              </div>
            </div>
            <span className="digit">4</span>
          </div>

          {/* Minimalist Typography */}
          <h1 className="error-title">
            Thước Phim Này Không Tồn Tại
          </h1>
          <p className="error-description">
            Trang bạn đang tìm kiếm không tồn tại trong kịch bản hoặc đã được chuyển sang trang khác.
          </p>

          {/* Compact Cinema Search Box */}
          <form className="cinema-search-box" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm phim theo tên, diễn viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="search-submit-btn">
                Tìm
              </button>
            </div>
          </form>

          {/* Action Navigation Buttons */}
          <div className="action-buttons-group">
            <Link href="/" className="btn-cinema btn-cinema-primary">
              <FaHome className="btn-icon" />
              <span>Về Trang Chủ</span>
            </Link>

            <button 
              type="button" 
              className="btn-cinema btn-cinema-secondary" 
              onClick={handleGoBack}
            >
              <FaArrowLeft className="btn-icon" />
              <span>Quay Lại</span>
            </button>
          </div>

          {/* Minimalist Quick Navigation Chips */}
          <div className="suggestions-section">
            <span className="suggestions-label">Khám phá trang khác:</span>
            <div className="suggestions-pills">
              {popularSuggestions.map((item, idx) => (
                <Link key={idx} href={item.href} className="suggestion-pill">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* 404 Minimalist Atmospheric Shell */
        .cinema-404-container {
          position: relative;
          min-height: calc(100vh - 75px);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #080b10;
          background-image: radial-gradient(circle at 50% 28%, rgba(229, 9, 20, 0.12) 0%, rgba(13, 17, 23, 0.8) 45%, #080b10 80%);
          color: #ffffff;
          overflow: hidden;
          /* Generous top margin/padding to guarantee zero overlap with sticky/fixed header */
          padding: clamp(100px, 14vh, 140px) 20px clamp(40px, 8vh, 70px);
        }

        /* Subtle Ambient Glow */
        .ambient-glow {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 420px;
          height: 320px;
          background: radial-gradient(ellipse at center, rgba(229, 9, 20, 0.14) 0%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
          z-index: 1;
        }

        /* Centered Content Card */
        .cinema-404-content {
          position: relative;
          z-index: 5;
          max-width: 540px;
          width: 100%;
          text-align: center;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Artistic 404 Display with Spinning Reel - Scaled Down */
        .artistic-404-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 0 auto 12px;
          user-select: none;
        }

        .digit {
          font-size: clamp(3.8rem, 8vw, 5.4rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -2px;
          background: linear-gradient(180deg, #ffffff 25%, #cbd5e1 65%, #64748b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 12px rgba(255, 255, 255, 0.08));
        }

        .reel-center-wrapper {
          position: relative;
          width: clamp(48px, 7vw, 64px);
          height: clamp(48px, 7vw, 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 2px;
        }

        .film-reel-spinner {
          width: 100%;
          height: 100%;
          animation: spinReel 14s linear infinite;
        }

        @keyframes spinReel {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .reel-outer-ring {
          position: relative;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(255, 255, 255, 0.65);
          border-radius: 50%;
          box-shadow: 
            0 0 16px rgba(229, 9, 20, 0.5),
            inset 0 0 10px rgba(229, 9, 20, 0.3);
          background: radial-gradient(circle, rgba(22, 27, 34, 0.95) 0%, rgba(8, 11, 16, 0.98) 100%);
        }

        .reel-spoke {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          transform-origin: center;
        }

        .spoke-1 { transform: translate(-50%, -50%) rotate(0deg); }
        .spoke-2 { transform: translate(-50%, -50%) rotate(45deg); }
        .spoke-3 { transform: translate(-50%, -50%) rotate(90deg); }
        .spoke-4 { transform: translate(-50%, -50%) rotate(135deg); }

        .reel-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32%;
          height: 32%;
          background: #e50914;
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px #e50914;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .core-light {
          width: 5px;
          height: 5px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 5px #ffffff;
        }

        /* Minimalist Typography */
        .error-title {
          font-size: clamp(1.2rem, 2.5vw, 1.55rem);
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.2px;
        }

        .error-description {
          font-size: clamp(0.85rem, 1.8vw, 0.94rem);
          color: #94a3b8;
          line-height: 1.55;
          max-width: 440px;
          margin: 0 auto 22px;
        }

        /* Compact Cinema Search Box */
        .cinema-search-box {
          width: 100%;
          max-width: 420px;
          margin-bottom: 24px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          background: rgba(22, 27, 34, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 4px 6px 4px 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .search-input-wrapper:focus-within {
          border-color: #e50914;
          box-shadow: 0 0 16px rgba(229, 9, 20, 0.3);
          background: rgba(22, 27, 34, 0.95);
        }

        .search-icon {
          color: #64748b;
          font-size: 0.85rem;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 0.86rem;
          padding: 5px 0;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .search-submit-btn {
          background: #e50914;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-submit-btn:hover {
          background: #ff1a26;
          box-shadow: 0 2px 10px rgba(229, 9, 20, 0.5);
        }

        /* Action Buttons Group - Compact */
        .action-buttons-group {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 26px;
          width: 100%;
        }

        .btn-cinema {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-cinema-primary {
          background: #e50914;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 14px rgba(229, 9, 20, 0.35);
        }

        .btn-cinema-primary:hover {
          color: #ffffff;
          background: #ff1a26;
          box-shadow: 0 6px 18px rgba(229, 9, 20, 0.55);
          transform: translateY(-1px);
        }

        .btn-cinema-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }

        .btn-cinema-secondary:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .btn-icon {
          font-size: 0.78rem;
        }

        /* Suggestions Section - Minimalist */
        .suggestions-section {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 18px;
        }

        .suggestions-label {
          display: block;
          font-size: 0.74rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .suggestions-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .suggestion-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 13px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          font-size: 0.76rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.18s ease;
        }

        .suggestion-pill:hover {
          color: #ffffff;
          background: rgba(229, 9, 20, 0.12);
          border-color: rgba(229, 9, 20, 0.35);
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}
