import { prisma } from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";


export async function POST (request: Request) {
    try {
        //1. LEER LOS DATOS ENVIADOS DEL JSON
        const body = await request.json();
        const {email, password, name} = body;

        //2. VALIDAMOS LOS CAMPOS OBLIGATORIOS
        if(!email || !password) {
            return NextResponse.json(
                {message: "the email and password is required"},
                {status: 400}
            );
        }

        //3. VALIDAR SI EL USUARIO YA EXISTE
        const existUser = await prisma.user.findUnique({
            where: { email },
        });
        if(existUser) {
            return NextResponse.json(
                {message: "User already exists"},
                {status: 400 }
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
            {message: "User register satisfactory"},
            {status: 201}
        );
    } catch (err) {
        console.error("Internal Server error: ", err);
        return NextResponse.json(
            {message: "Internal server error"},
            {status: 500}
        );
    }
};