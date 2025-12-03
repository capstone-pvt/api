import { Request } from 'express';

/**
 * Extract IP address from request
 * Handles proxies and X-Forwarded-For header
 */
export function getIp(request: Request): string {
  // Check various headers for the real IP (in case of proxies)
  const xForwardedFor = request.headers['x-forwarded-for'];
  const xRealIp = request.headers['x-real-ip'];

  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    const ips = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor.split(',')[0];
    return ips.trim();
  }

  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  // Fallback to connection remote address
  return (
    request.socket.remoteAddress ||
    request.ip ||
    'unknown'
  );
}

/**
 * Extract User-Agent from request headers
 */
export function getUserAgent(request: Request): string {
  const userAgent = request.headers['user-agent'];
  return userAgent || 'unknown';
}
