import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd23pzr22xoegue.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'd1rxenf9seg5xc.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
