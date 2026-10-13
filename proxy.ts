import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth/token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Routes protected by token validation.
export const config = {
  matcher: ["/dashboard/:path*"],
};
