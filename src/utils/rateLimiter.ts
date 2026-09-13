// Rate limiting for Next.js API routes
import { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore - LRU cache types compatibility
const LRU = require('lru-cache');

// Create a cache to store IP-based rate limiting data
const rateLimit = new LRU({
  max: 500, // Maximum number of items in cache
  maxAge: 60 * 1000, // Time to live: 1 minute (v6 uses maxAge instead of ttl)
});

/**
 * Rate limiting middleware for Next.js API routes
 * @param limit Maximum number of requests per minute
 */
export function rateLimiter(limit = 30) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.url}`;

    // Get current count for this IP and endpoint
    const currentRequests = rateLimit.get(key) as number || 0;
    
    // Check if the IP has exceeded the limit
    if (currentRequests >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.'
      });
    }
    
    // Increment the count
    rateLimit.set(key, currentRequests + 1);
    
    // Continue to the actual API handler
    if (next) next();
    return true;
  };
}

export default rateLimiter;