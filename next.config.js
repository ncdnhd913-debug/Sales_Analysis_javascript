/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Vercel 배포 최적화
  output: 'standalone',
  // 이미지 최적화 비활성화 (필요시)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
