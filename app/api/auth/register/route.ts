import { prisma } from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { registerSchema } from "@/lib/validations/auth";
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

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    //3. VALIDAR SI EL USUARIO YA EXISTE
    const existUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existUser) {
      return NextResponse.json(
        { code: API_ERROR_CODES.USER_ALREADY_EXISTS },
        { status: 409 },
      );
    }

    //4. Vamos a hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. GUARDAMOS EL USUARIO EN POSTGRES USANDO PRISMA
     await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json(
      {  },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { code: API_ERROR_CODES.USER_ALREADY_EXISTS },
        { status: 409 },
      );
    }
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
