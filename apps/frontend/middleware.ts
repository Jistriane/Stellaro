import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const handleI18n = createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export default function middleware(request: NextRequest) {
  const url = new URL(request.url);

  const lang = url.searchParams.get('lang');
  const isSupported = lang === 'en' || lang === 'pt';

  if (isSupported) {
    // Set cookie and redirect to URL without the query param
    url.searchParams.delete('lang');
    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', lang!, { path: '/' });
    return response;
  }

  // Fallback to default next-intl middleware
  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
