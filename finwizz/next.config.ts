/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    concurrentFeatures: false, // <- Set this option to false.
    serverComponents: true,
  },
}

module.exports = nextConfig