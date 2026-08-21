import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
