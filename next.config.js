/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  // Configure API routes
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

module.exports = nextConfig; 