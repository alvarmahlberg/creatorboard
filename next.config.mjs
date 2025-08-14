/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@zoralabs/coins-sdk']
  }
};
export default nextConfig;
