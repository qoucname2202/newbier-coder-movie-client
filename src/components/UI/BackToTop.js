import React, { useState, useEffect } from 'react';

/**
 * @file BackToTop.js
 * @description Floating back to top button with smooth scroll behavior and fade animation.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      className="back-to-top-btn"
      title="Lên đầu trang"
    >
      <i className="fas fa-chevron-up" />

      <style jsx>{`
        .back-to-top-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(20, 20, 25, 0.85);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.1rem;
          z-index: 999;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: btnFadeIn 0.3s ease-out;
        }

        .back-to-top-btn:hover {
          background: #e50914;
          border-color: #e50914;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 12px 28px rgba(229, 9, 20, 0.4);
        }

        .back-to-top-btn:active {
          transform: translateY(-1px) scale(0.98);
        }

        @keyframes btnFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 576px) {
          .back-to-top-btn {
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </button>
  );
}
