import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allows the dev server's JS/HMR assets to load when the site is opened
  // from another device on the LAN (e.g. a phone hitting your PC's IP)
  // instead of localhost. Without this, Next.js returns 403s for those
  // cross-origin dev requests, so the page renders but client components
  // never hydrate and none of their interactive elements respond to touch.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'portalvhdsp62n0yt356llm.blob.core.windows.net',
        pathname: '/bailataan-mediaitems/**',
      },
    ],
  },
};

export default nextConfig;
