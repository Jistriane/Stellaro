import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    isrMemoryCacheSize: 0,
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },
};

export default withNextIntl(nextConfig);
