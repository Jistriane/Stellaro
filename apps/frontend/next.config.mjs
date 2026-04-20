import createNextIntlPlugin from 'next-intl/plugin';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const resolvedBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (isGitHubPages && repositoryName ? `/${repositoryName}` : '');

const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Keep next/image API surface minimal while we stay on Next 14.
    unoptimized: true,
    remotePatterns: [],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
    contentDispositionType: 'attachment',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
  ...(isGitHubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath: resolvedBasePath,
        assetPrefix: resolvedBasePath,
      }
    : {}),
};

// Only apply next-intl plugin when NOT building for GitHub Pages
// (next-intl is incompatible with static export)
const withNextIntl = isGitHubPages
  ? (config) => config
  : createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);