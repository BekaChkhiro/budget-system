import { NextRequest } from 'next/server';

declare module '@/lib/utils/ip-utils' {
  export function getValidIP(request: NextRequest): string | null;
  export function isValidIP(ip: string | null): boolean;
}
