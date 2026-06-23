// src/middleware.ts
// Runs before every page load. Two jobs:
//   1. Maintenance-mode redirect.
//   2. Expose the request pathname to Server Components (via x-url-path)
//      so the root layout can set <html lang> = "ko" for /ko routes.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Forward the pathname so RSC layouts can read it via headers().
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url-path', request.nextUrl.pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  // Allow access to the maintenance page itself.
  if (request.nextUrl.pathname === '/maintenance') {
    return pass();
  }

  // If maintenance mode is ON, redirect everyone to the maintenance page.
  if (isMaintenanceMode) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return pass();
}

export const config = {
  matcher: [
    // Match all request paths except static files and image optimization.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
