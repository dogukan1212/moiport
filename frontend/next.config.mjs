/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Not: Mobil uygulama (Static Export) modunda rewrites çalışmaz.
  // API çağrılarının tam URL'ye (https://api...) gitmesi gerekir.
  /*
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3001/socket.io/:path*",
      },
    ];
  },
  */
};

export default nextConfig;
