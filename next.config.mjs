/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Desactivar Turbopack para usar webpack
  // experimental: {
  //   turbo: false,
  // },
}

export default nextConfig
