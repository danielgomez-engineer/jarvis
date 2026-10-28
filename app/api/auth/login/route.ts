import { prisma } from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/auth/token";
import { loginSchema } from "@/lib/validations/auth";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_JSON }, { status: 400 });
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { email, password } = validation.data;

    // 3. VALIDAR EN LA BD SI EXISTE EL USUARIO
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        { code: API_ERROR_CODES.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    //4. COMPARAR LAS CONTASEÑAS SI SON IGUALES
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { code: API_ERROR_CODES.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    //5 SI LAS VALIDACIONES ANTERIORES SON CORRECTAS FIRMAMOS EL TOKEN
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: "1d" },
    );

    // 6. RETORNAMOS  LA RESPUESTA EXITOSA
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    );

    // 7. INYECTAMOS LA COOKIE HTTPONLY DE FORMA SEGURA
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true, // prohibe cualquier script en Javascript que pueda leer o robar el token
      secure: process.env.NODE_ENV === "production", // solo https en produccion
      sameSite: "lax", // proteccion contra ataques CSRF
      path: "/", // disponible en toda la app
      maxAge: 60 * 60 * 24, // expira en un dia (en segundos)
    });

    return response;
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
