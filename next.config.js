/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/blog',
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
}

module.exports = nextConfig