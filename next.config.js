/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xbjehtrzxkycliualili.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Exclude Supabase functions from the build
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /supabase\/functions/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig; 