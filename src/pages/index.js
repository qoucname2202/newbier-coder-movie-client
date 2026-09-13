import { useState, useEffect, useRef } from "react";
import MovieList from "../components/Movie/MovieList";
import HeroBanner from "../components/Movie/HeroBanner";
import { useAuth } from "../utils/auth";
import { useRouter } from "next/router";

export default function Home() {
  const { isAuthenticated, isAccountLocked } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const router = useRouter();
  const checkTimeoutRef = useRef(null);
  
  // Check account status only once on mount and prevent repeated requests
  useEffect(() => {
    // Avoid any action if we've already started redirecting
    if (redirected) return;
    
    if (isAuthenticated && isAccountLocked) {
      setRedirected(true);
      
      // Store account lock status in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAccountLocked', 'true');
      }
      
      // Clear any previous timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      
      // Use a timeout to prevent immediate redirects that could cause rendering loops
      checkTimeoutRef.current = setTimeout(() => {
        console.log("Account locked, redirecting to locked page");
        // Use direct window location change instead of Next.js router
        // to prevent additional renders and state updates
        window.location.href = '/account-locked';
      }, 300);
    }
    
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isAccountLocked, redirected]);
  
  // Apply an extra layer of protection against data fetching when locked
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true') {
      // Block data fetching for this page specifically
      const originalFetch = window.fetch;
      const fetchBlocker = function(url, options) {
        if (typeof url === 'string' && url.includes('/_next/data')) {
          console.log('Blocking fetch from index page:', url);
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

  // Simple check if account is locked before initial render
  if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true') {
    // We're client-side and the account is locked
    // Return minimal content to prevent data fetching
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        <p>Đang chuyển hướng đến trang tài khoản bị khóa...</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      <HeroBanner />
      <div className="container-fluid mt-5 px-4">
        <h5 className="mb-4" style={{ color: "#000000" }}></h5>
        <MovieList />
      </div>
      
      <style jsx global>{`
        body {
          background-color: #000;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

// Switch to static props to avoid constant server-side rendering
export async function getStaticProps() {
  return {
    props: {}
  };
}
