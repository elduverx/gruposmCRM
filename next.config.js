/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['nominatim.openstreetmap.org'],
  },
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: [],
  },
  // Desactivar la generación estática para las rutas de dashboard
  output: 'standalone',
  
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
  webpack: (config, { isServer }) => {
    // Add aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    // Set extensions resolution
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', ...config.resolve.extensions];
    
    // Set module resolution paths
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, '.'),
      'node_modules'
    ];

    // Handle Leaflet images
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    });

    return config;
  },
};

module.exports = nextConfig; 