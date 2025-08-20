/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para melhorar a compatibilidade com deploy
  experimental: {
    // Desabilitar algumas features experimentais que podem causar problemas
    serverComponentsExternalPackages: [],
  },
  
  // Configurações de build
  swcMinify: true,
  
  // Configurações de imagens
  images: {
    domains: [],
    unoptimized: false,
  },
  
  // Configurações de webpack para melhorar a compatibilidade
  webpack: (config, { isServer }) => {
    // Configurações específicas para o cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Configurações de headers para melhorar a segurança
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
        ],
      },
    ];
  },
};

export default nextConfig;
