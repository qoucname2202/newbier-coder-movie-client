import React from 'react';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 | MovieStreaming</title>
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="minimal-404-container">
        <div className="minimal-404-glow" aria-hidden="true" />
        <span className="minimal-404-code">404</span>
      </div>

      <style jsx global>{`
        .minimal-404-container {
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

        .minimal-404-glow {
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

        .minimal-404-code {
          position: relative;
          z-index: 2;
          font-size: clamp(6.5rem, 18vw, 13rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -4px;
          background: linear-gradient(180deg, #ffffff 30%, #cbd5e1 70%, #64748b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.75));
        }

        @media (max-width: 768px) {
          .minimal-404-code {
            letter-spacing: -2px;
          }
        }
      `}</style>
    </>
  );
}
