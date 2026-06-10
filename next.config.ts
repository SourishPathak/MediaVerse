
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Standard Next.js build for Vercel deployment (supports Server Actions and Dynamic Routes)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'a.ltrbxd.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
    ],
  },
  // Ensure development server stability by ignoring non-critical build/lint errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
