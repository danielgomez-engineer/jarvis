import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../errors/codes";


//=========================================================verify JWT_SECRET============================================================
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

//=========================================================verify Token============================================================
export function verifyToken(token: string): { userId: number } | null {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
      return null;
    }

    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

//=========================================================Valid Token============================================================
export async function validToken(): Promise<NextResponse | { userId: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { code: API_ERROR_CODES.UNAUTHORIZED },
      { status: 401 },
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { code: API_ERROR_CODES.UNAUTHORIZED },
      { status: 401 },
    );
  }
  return decoded; // Return { userId: number }
}