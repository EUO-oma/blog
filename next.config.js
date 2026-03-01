/** @type {import('next').NextConfig} */
const useBlogBasePath = process.env.NEXT_PUBLIC_USE_BLOG_BASEPATH === '1'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Firebase Hosting 루트 배포는 basePath 미사용, GitHub Pages 배포 때만 /blog 사용
  basePath: useBlogBasePath ? '/blog' : '',
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
