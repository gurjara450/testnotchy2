/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      timeout: 60
    }
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  }
}

module.exports = nextConfig 