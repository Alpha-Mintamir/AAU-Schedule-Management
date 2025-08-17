import { NextRequest, NextResponse } from 'next/server';

// Dev-friendly: only enforce guard when explicitly enabled
export function middleware(req: NextRequest) {
  const enforce = process.env.ENABLE_AUTH_GUARD === 'true';
  if (!enforce) return NextResponse.next();

  const url = new URL(req.url);
  if (url.pathname.startsWith('/admin')) {
    const hasSession = req.cookies.get('ba_session');
    if (!hasSession) {
      url.pathname = '/(auth)/signin';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };


