import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed',
  localeDetection: true,
});

export const config = {
  // Não executar middleware em rotas especiais de erro
  matcher: ['/((?!_next|.*\\..*|api|404|500|_error).*)'],
};
