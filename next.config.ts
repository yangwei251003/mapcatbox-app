import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    // Offline builds cannot embed a private machine's cloud configuration.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_CLOUD_MODE === 'true' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '') : '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_CLOUD_MODE === 'true' ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') : '',
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
