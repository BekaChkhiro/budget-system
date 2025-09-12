import { NextRequest } from 'next/server';

/**
 * Extracts the client's IP address from the request headers
 * @param request - The incoming request object
 * @returns The client's IP address or null if not found
 */
export function getIP(request: NextRequest): string | null {
  // Get the x-forwarded-for header
  const xForwardedFor = request.headers.get('x-forwarded-for');
  
  // If x-forwarded-for exists, return the first IP in the list
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Fallback to x-real-ip header
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP.trim();
  }
  
  // Fallback to the remote address from various headers
  const remoteAddress = request.headers.get('x-vercel-ip') || 
                       request.headers.get('x-vercel-forwarded-for') ||
                       request.headers.get('cf-connecting-ip') ||
                       request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       request.headers.get('x-client-ip') ||
                       null;
  
  return remoteAddress ? remoteAddress.split(',')[0].trim() : null;
}

/**
 * Validates if the given IP address is valid
 * @param ip - The IP address to validate
 * @returns boolean indicating if the IP is valid
 */
export function isValidIP(ip: string | null): boolean {
  if (!ip) return false;
  
  // Check for IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // Check for IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Gets the client's IP address with validation
 * @param request - The incoming request object
 * @returns The validated IP address or 'anonymous' if not found/invalid
 */
export function getValidIP(request: NextRequest): string {
  const ip = getIP(request);
  return ip && isValidIP(ip) ? ip : 'anonymous';
}
