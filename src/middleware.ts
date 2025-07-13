import { withAuth } from "next-auth/middleware"
import { NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*"]
}; 