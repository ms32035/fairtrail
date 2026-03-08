/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    'playwright',
    'better-sqlite3',
    'geoip-lite',
    'cron',
    'ioredis',
    'ua-parser-js',
    '@anthropic-ai/sdk',
    'openai',
    '@google/generative-ai',
  ],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
