import { NextRequest } from 'next/server';

/**
 * Extract request metadata for activity logging
 */
export function getRequestMetadata(request: NextRequest) {
  const headers = request.headers;

  return {
    ipAddress: getClientIP(request),
    userAgent: headers.get('user-agent') || undefined,
    referer: headers.get('referer') || undefined,
    origin: headers.get('origin') || undefined,
  };
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: NextRequest): string | undefined {
  const headers = request.headers;

  // Check various headers for IP address (in order of preference)
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0]?.trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to connection remote address (may not be available in all environments)
  return undefined;
}

/**
 * Basic IP address validation
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get user agent information
 */
export function parseUserAgent(userAgent?: string) {
  if (!userAgent) return {};

  const info: Record<string, string> = {};

  // Browser detection
  if (userAgent.includes('Chrome')) {
    info.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    info.browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    info.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    info.browser = 'Edge';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    info.os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    info.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    info.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    info.os = 'Android';
  } else if (userAgent.includes('iOS')) {
    info.os = 'iOS';
  }

  // Device type detection
  if (userAgent.includes('Mobile')) {
    info.deviceType = 'mobile';
  } else if (userAgent.includes('Tablet')) {
    info.deviceType = 'tablet';
  } else {
    info.deviceType = 'desktop';
  }

  return info;
}
