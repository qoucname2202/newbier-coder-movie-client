import React from 'react';
import Head from 'next/head';

/**
 * @file pages/maintenance.js
 * @description Minimalist Cinema System Maintenance Page.
 * Styled in the exact dark aesthetic as the 404 page with zero noise, zero animations,
 * and high-contrast ambient gradient typography.
 */
export default function Maintenance() {
  return (
    <>
      <Head>
        <title>Hệ thống đang bảo trì | MovieStreaming</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="minimal-maintenance-container">
        <div className="minimal-maintenance-glow" aria-hidden="true" />
        <div className="minimal-maintenance-content">
          <span className="minimal-maintenance-code">503</span>
          <span className="minimal-maintenance-subtitle">HỆ THỐNG ĐANG BẢO TRÌ</span>
        </div>
      </div>

      <style jsx global>{`
        .minimal-maintenance-container {
          position: relative;
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #080b10;
          background-image: radial-gradient(circle at 50% 50%, rgba(229, 9, 20, 0.09) 0%, rgba(13, 17, 23, 0.65) 45%, #080b10 80%);
          color: #ffffff;
          overflow: hidden;
          user-select: none;
          padding: 64px 20px 40px;
        }

        .minimal-maintenance-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 340px;
          background: radial-gradient(ellipse at center, rgba(229, 9, 20, 0.12) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .minimal-maintenance-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .minimal-maintenance-code {
          font-size: clamp(6.5rem, 18vw, 13rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -4px;
          background: linear-gradient(180deg, #ffffff 30%, #cbd5e1 70%, #64748b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.75));
        }

        .minimal-maintenance-subtitle {
          font-size: clamp(0.75rem, 1.8vw, 0.95rem);
          font-weight: 700;
          color: #8b949e;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .minimal-maintenance-code {
            letter-spacing: -2px;
          }
          .minimal-maintenance-subtitle {
            letter-spacing: 2px;
          }
        }
      `}</style>
    </>
  );
}
