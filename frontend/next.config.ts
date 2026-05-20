import type { NextConfig } from 'next';

// 診断用: ビルド時にenv varが渡っているか確認 (後で削除)
console.log('[ENV CHECK] NEXT_PUBLIC_SQUARE_APPLICATION_ID:', process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '(empty)');
console.log('[ENV CHECK] NEXT_PUBLIC_SQUARE_LOCATION_ID:', process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '(empty)');

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
    ],
  },
};

export default nextConfig;
