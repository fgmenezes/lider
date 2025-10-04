import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"; // Importar o cliente Prisma

// Definir as opções de autenticação
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email e senha são obrigatórios');
          }

          // Find the user in the database by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              masterMinistry: true, // Busca o ministério liderado, se houver
              ministry: true, // Busca o ministério do usuário (para LEADER)
            },
          });

          // If no user is found, return null
          if (!user) {
            throw new Error('Usuário não encontrado');
          }

          // Compare the provided password with the hashed password in the database
          const passwordMatch = await compare(credentials.password, user.password);

          // If the passwords match, return the user object
          if (passwordMatch) {
            // Descobrir o nome do ministério
            let ministryName = null;
            if ((user as any).masterMinistry) {
              ministryName = (user as any).masterMinistry.name;
            } else if ((user as any).ministry) {
              ministryName = (user as any).ministry.name;
            }
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              ministryId: (user as any).ministryId,
              masterMinistryId: (user as any).masterMinistryId,
              masterMinistry: (user as any).masterMinistry ? { id: (user as any).masterMinistry.id, name: (user as any).masterMinistry.name } : null,
              ministryName,
            };
          } else {
            throw new Error('Senha incorreta');
          }
        } catch (error) {
          throw error;
        }
      }
    })
  ],
  debug: false, // Desabilitar debug para evitar exposição de credenciais na URL
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login', // Adiciona página de erro customizada
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.ministryId = user.ministryId;
        token.masterMinistryId = (user as any).masterMinistryId;
        token.masterMinistry = (user as any).masterMinistry || null;
        token.ministryName = (user as any).ministryName || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.ministryId = token.ministryId;
        session.user.masterMinistryId = token.masterMinistryId;
        session.user.masterMinistry = token.masterMinistry || null;
        session.user.ministryName = token.ministryName || null;
      }
      return session;
    }
  }
};