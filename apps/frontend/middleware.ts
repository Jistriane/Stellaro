import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
