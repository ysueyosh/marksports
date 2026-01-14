import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd23pzr22xoegue.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
