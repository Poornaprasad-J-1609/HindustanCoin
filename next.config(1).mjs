/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "**.coingecko.com" },
    ],
  },
}
export default nextConfig
