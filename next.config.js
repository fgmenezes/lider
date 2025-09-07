/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para produção
  experimental: {
    optimizeCss: true,
  },
  
  // Configurações de build
  poweredByHeader: false,
  generateEtags: false,
  
  // Otimizações de imagem
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Configurações de output para deploy
  output: 'standalone',
  
  // Configurações de compressão
  compress: true,
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;