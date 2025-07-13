import NextAuth from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role?: Role | null
    ministryId?: string | null
  }

  interface Session {
    user: {
      role?: Role | null
      ministryId?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role | null
    ministryId?: string | null
  }
} 