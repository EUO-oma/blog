/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // Firebase 동적 데이터로 인해 정적 export 불가
  // basePath: '/blog', // GitHub Pages가 아닌 다른 방식으로 배포
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig