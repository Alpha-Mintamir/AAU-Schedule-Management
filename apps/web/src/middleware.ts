import { NextRequest, NextResponse } from 'next/server';

// Minimal guard: redirect unauthenticated users to /signin when hitting /admin
export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.startsWith('/admin')) {
    // Placeholder check: in real setup, read Better Auth session cookie.
    const hasSession = req.cookies.get('ba_session');
    if (!hasSession) {
      url.pathname = '/(auth)/signin';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };


