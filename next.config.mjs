/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Desactivar Turbopack para usar webpack
  // experimental: {
  //   turbo: false,
  // },
}

export default nextConfig
