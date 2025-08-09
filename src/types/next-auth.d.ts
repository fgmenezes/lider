import NextAuth, { DefaultSession } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    role?: Role | null
    ministryId?: string | null
    masterMinistryId?: string | null
    masterMinistry?: { id: string; name: string } | null
    ministryName?: string | null
  }

  interface Session {
    user: {
      id: string
      role?: Role | null
      ministryId?: string | null
      masterMinistryId?: string | null
      masterMinistry?: { id: string; name: string } | null
      ministryName?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: Role | null
    ministryId?: string | null
    masterMinistryId?: string | null
    masterMinistry?: { id: string; name: string } | null
    ministryName?: string | null
  }
}