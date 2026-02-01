/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle PDF.js worker and canvas
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
}

module.exports = nextConfig
