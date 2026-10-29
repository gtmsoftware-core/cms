import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gtmsoftware-core/cms-sdk'],
  serverExternalPackages: ['@electric-sql/pglite'],
  experimental: {
    // Media uploads go through a server action: 4 MB per file (MAX_MEDIA_BYTES) plus the multipart overhead.
    serverActions: { bodySizeLimit: '4.5mb' },
  },
};

export default nextConfig;
