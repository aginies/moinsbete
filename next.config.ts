import type { NextConfig } from "next";
import type { PWAConfig } from 'next-pwa';
import withPWA from 'next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fr.wikipedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'lejournal.cnrs.fr' },
    ],
  },
  allowedDevOrigins: ['100.0.0.0/8', '10.0.1.78'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/fr/:path*',
        destination: '/:path*',
      },
      {
        source: '/en/:path*',
        destination: '/:path*',
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const integratedConfig = withNextIntl(nextConfig);

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
} as PWAConfig)(integratedConfig as any) as any;
