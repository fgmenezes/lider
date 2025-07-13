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
          console.log('Authorize function called on server.');
          console.log('Credentials received:', credentials);

          if (!credentials?.email || !credentials?.password) {
            console.log('Email or password not provided.');
            throw new Error('Email e senha são obrigatórios');
          }

          // Find the user in the database by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              masterOf: true, // Busca o ministério liderado, se houver
            },
          });

          console.log('User found:', user ? user.email : 'none');

          // If no user is found, return null
          if (!user) {
            console.log('User not found.');
            throw new Error('Usuário não encontrado');
          }

          // Compare the provided password with the hashed password in the database
          const passwordMatch = await compare(credentials.password, user.password);

          console.log('Password comparison result:', passwordMatch);

          // If the passwords match, return the user object
          if (passwordMatch) {
            console.log('Password match. Returning user.');
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              ministryId: (user as any).ministryId,
              masterOf: (user as any).masterOf ? { id: (user as any).masterOf.id, name: (user as any).masterOf.name } : null
            };
          } else {
            console.log('Password does NOT match.');
            throw new Error('Senha incorreta');
          }
        } catch (error) {
          console.error('Error in authorize:', error);
          throw error;
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login', // Adiciona página de erro customizada
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.ministryId = user.ministryId;
        token.masterOf = (user as any).masterOf || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.ministryId = token.ministryId;
        session.user.masterOf = token.masterOf || null;
      }
      return session;
    }
  }
}; 