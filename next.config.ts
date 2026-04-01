import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem output: "export" — Cloudflare Pages usa @cloudflare/next-on-pages
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['preview-chat-3f40f7dc-5624-416f-aedd-77686df6336a.space.z.ai', 'space.z.ai', '*.space.z.ai'],
  // Edge runtime para Cloudflare Pages
  experimental: {
    // Permite que API routes rodem no edge
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
};

export default nextConfig;
