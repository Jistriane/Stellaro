import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(frontendRoot, '../../..');

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const resolvedBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (isGitHubPages && repositoryName ? `/${repositoryName}` : '');

const securityHeaders = [
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
];

const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: workspaceRoot,
  },
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
  ...(isGitHubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath: resolvedBasePath,
        assetPrefix: resolvedBasePath,
      }
    : {}),
  ...(!isGitHubPages
    ? {
        async headers() {
          return [
            {
              source: '/:path*',
              headers: securityHeaders,
            },
          ];
        },
      }
    : {}),
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);