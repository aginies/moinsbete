import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fr.wikipedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  allowedDevOrigins: ['100.0.0.0/8', '10.0.0.0/8'],
};

export default nextConfig;
