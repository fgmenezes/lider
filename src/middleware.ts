import { withAuth } from "next-auth/middleware"
import { NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Exporta o middleware padrão do NextAuth
export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // Continua com o middleware padrão do NextAuth
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

// Aplica o middleware de autenticação apenas para rotas do dashboard
// Removendo API routes do matcher para evitar conflito com a autenticação interna das APIs
export const config = {
  matcher: ["/dashboard/:path*"]
};