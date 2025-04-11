/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['nominatim.openstreetmap.org'],
  },
  output: 'standalone',
  // Disable static page generation for routes that need database access
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  // Configure dynamic routes and disable static generation for database-dependent routes
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/noticia',
        destination: '/noticia',
      }
    ]
  },
  // Configure module resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', ...config.resolve.extensions];
    config.resolve.modules = [path.resolve(__dirname, 'src'), 'node_modules'];
    config.resolve.symlinks = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig; 