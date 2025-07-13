import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { authOptions } from '@/lib/auth'; // Importar authOptions do arquivo centralizado

const prisma = new PrismaClient()

// Usar as opções importadas diretamente na chamada NextAuth
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }