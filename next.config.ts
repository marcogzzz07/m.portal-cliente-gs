import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El indicador de desarrollo tapaba el usuario del sidebar y el botón de demo.
  devIndicators: false,
  // Fotografías de Novedades (Unsplash, licencia libre).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
