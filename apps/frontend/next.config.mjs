import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const resolvedBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (isGitHubPages && repositoryName ? `/${repositoryName}` : '');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(isGitHubPages
    ? {
        output: 'export',
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
        basePath: resolvedBasePath,
        assetPrefix: resolvedBasePath || undefined,
      }
    : {}),
};

export default withNextIntl(nextConfig);