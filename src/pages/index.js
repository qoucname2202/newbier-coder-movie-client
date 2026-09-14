/**
 * @file pages/index.js
 * @description Homepage displaying featured cinematic hero banner and movie category rails.
 */

import { useState, useEffect, useRef } from "react";
import MovieList from "../components/Movie/MovieList";
import HeroBanner from "../components/Movie/HeroBanner";
import { useAuth } from "../utils/auth";
import { useRouter } from "next/router";

/**
 * Main Home page component.
 * @returns {JSX.Element} Rendered homepage layout.
 */
export default function Home() {
  const { isAuthenticated, isAccountLocked } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const router = useRouter();
  const checkTimeoutRef = useRef(null);

  // Check account status only once on mount and prevent repeated redirects
  useEffect(() => {
    if (redirected) return;

    if (isAuthenticated && isAccountLocked) {
      setRedirected(true);

      if (typeof window !== 'undefined') {
        localStorage.setItem('isAccountLocked', 'true');
      }

      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(() => {
        window.location.href = '/account-locked';
      }, 300);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isAccountLocked, redirected]);

  // Block data fetching when locked
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true') {
      const originalFetch = window.fetch;
      const fetchBlocker = function(url, options) {
        if (typeof url === 'string' && url.includes('/_next/data')) {
          return Promise.resolve(new Response(JSON.stringify({ blocked: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return originalFetch(url, options);
      };

      window.fetch = fetchBlocker;

      return () => {
        window.fetch = originalFetch;
      };
    }
  }, []);

  // Display lock warning if account is flagged
  if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true') {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        <p>Đang chuyển hướng đến trang tài khoản bị khóa...</p>
      </div>
    );
  }

  return (
    <div className="home-container bg-black text-white">
      {/* Full-bleed cinematic hero banner */}
      <HeroBanner />

      {/* Main movie category rails */}
      <div className="container-fluid mt-4 px-3 px-lg-4">
        <MovieList />
      </div>

      <style jsx global>{`
        body {
          background-color: #0d1117;
          color: #ffffff;
        }

        .home-container {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}

/**
 * Static props fetching to avoid unnecessary server-side rendering bottlenecks.
 * @returns {Promise<{ props: Object }>} Empty static props object.
 */
export async function getStaticProps() {
  return {
    props: {}
  };
}
