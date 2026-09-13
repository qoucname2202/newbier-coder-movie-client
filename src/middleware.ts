import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting
// Using a Map to store request counts per IP address
const ipRequestCounts = new Map<string, { count: number, timestamp: number }>();
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // Maximum requests allowed per window per IP for /_next/data/ routes

// Trang không cần xác thực
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/account-locked',
  '/404',
  '/500',
  '/_next',
  '/api',
  '/favicon.ico',
  '/img'
];

// Kiểm tra nếu path hiện tại là path công khai
const isPublicPath = (path: string): boolean => {
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Kiểm tra nếu tài khoản bị khóa (dựa vào cookie)
  const isAccountLocked = request.cookies.get('isAccountLocked')?.value === 'true';
  
  // Nếu tài khoản bị khóa và không phải trang công khai, chuyển hướng đến trang account-locked
  if (isAccountLocked && !isPublicPath(pathname) && pathname !== '/account-locked') {
    const url = new URL('/account-locked', request.url);
    return NextResponse.redirect(url);
  }

  // Only apply rate limiting to _next/data routes which are causing the spam
  if (pathname.includes('/_next/data/')) {
    const ip = request.ip || 'unknown';
    const url = pathname;
    const key = `${ip}:${url}`;
    const now = Date.now();
    
    // Get current record for this IP
    const record = ipRequestCounts.get(key);
    
    // If no record exists or the record is older than our window, create a new one
    if (!record || now - record.timestamp > WINDOW_SIZE_MS) {
      ipRequestCounts.set(key, { count: 1, timestamp: now });
    } else {
      // Increment the count for existing records
      record.count += 1;
      
      // Return rate limiting response if too many requests
      if (record.count > MAX_REQUESTS_PER_WINDOW) {
        console.log(`Rate limiting applied to ${key} - ${record.count} requests`);
        
        // Clean up old entries periodically to prevent memory leaks
        if (ipRequestCounts.size > 1000) {
          const keysToDelete = [];
          for (const [mapKey, mapRecord] of ipRequestCounts.entries()) {
            if (now - mapRecord.timestamp > WINDOW_SIZE_MS) {
              keysToDelete.push(mapKey);
            }
          }
          keysToDelete.forEach(k => ipRequestCounts.delete(k));
        }
        
        // Return 429 Too Many Requests
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Too many requests' }),
          { 
            status: 429, 
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        );
      }
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    // Apply to all routes except api routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Apply to all /_next/data/ routes
    '/_next/data/:path*',
  ],
};