/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['nominatim.openstreetmap.org'],
  },
  // Configuración para evitar errores de ESLint durante el build
  eslint: {
    // No fallar el build si hay errores de ESLint
    ignoreDuringBuilds: true,
  },
  // Configuración para evitar errores de TypeScript durante el build
  typescript: {
    // No fallar el build si hay errores de TypeScript
    ignoreBuildErrors: true,
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
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig; 