/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig
