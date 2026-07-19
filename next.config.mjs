/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allowed remote image hosts. The cards currently render plain <img> (not
  // next/image), so these aren't enforced yet — they're here so the domains are
  // already whitelisted if/when a card switches to next/image. Wikipedia serves
  // its actual thumbnail files from upload.wikimedia.org.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "cdn.nba.com" },
      { protocol: "https", hostname: "en.wikipedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
