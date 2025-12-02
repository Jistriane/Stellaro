import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

export default withNextIntl(nextConfig);
