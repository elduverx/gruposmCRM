/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig; 