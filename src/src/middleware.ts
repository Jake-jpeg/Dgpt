// src/middleware.ts
// This runs BEFORE every page load - perfect for maintenance mode

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  
  // Allow access to maintenance page itself
  if (request.nextUrl.pathname === '/maintenance') {
    return NextResponse.next();
  }
  
  // If maintenance mode is ON, redirect everyone to maintenance page
  if (isMaintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  
  // Otherwise, allow normal access
  return NextResponse.next();
}

// Run middleware on all routes except static files and API routes (optional)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
