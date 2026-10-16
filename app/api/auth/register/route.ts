import { prisma } from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
    }

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    //3. VALIDAR SI EL USUARIO YA EXISTE
    const existUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 },
      );
    }

    //4. Vamos a hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. GUARDAMOS EL USUARIO EN POSTGRES USANDO PRISMA
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json(
      { message: "User register satisfactory" },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 },
      );
    }
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
