import { prisma } from "@/lib/prisma/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';


export async function POST (request: Request) {
    try {
        //1. LEER LOS DATOS DEL JSON
        const body = await request.json();
        const {email, password} = body;

        //2. VALIDAR QUE VENGAN LOS CAMPOS OBLIGATORIOS
        if(!email || !password) {
            return NextResponse.json(
                {message: "The email and password ir required"},
                {status: 400}
            );
        }

        // 3. VALIDAR EN LA BD SI EXISTE EL USUARIO
        const user = await prisma.user.findUnique({
            where: {email},
        });
        if(!user) {
            return NextResponse.json(
                {message: "Invalid credentials"},
                {status: 401}
            );
        }

        //4. COMPARAR LAS CONTASEÑAS SI SON IGUALES
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword) {
            return NextResponse.json(
                {message: "Invalid credentials"},
                {status: 401}
            );
        }

        //5 SI LAS VALIDACIONES ANTERIORES SON CORRECTAS FIRMAMOS EL TOKEN
        const token = jwt.sign({ userId: user.id, email: user.email}, 
            process.env.JWT_SECRET!, {expiresIn: "1d"});
         
        // 6. RETORNAMOS  LA RESPUESTA EXITOSA
        const response = NextResponse.json(
            {message: "Login succeful",
            token,
            user: {
                id: user.id, 
                email: user.email,
                name: user.name}
            },
        {status: 200});

        // 7. INYECTAMOS LA COOKIE HTTPONLY DE FORMA SEGURA
        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true, // prohibe cualquier script en Javascript que pueda leer o robar el token
            secure: process.env.NODE_ENV === "production", // solo https en produccion
            sameSite: "lax", // proteccion contra ataques CSRF
            path: "/", // disponible en toda la app
            maxAge: 60 * 60 * 24 // expira en un dia (en segundos)
        });

        return response;

    } catch (err) {
        console.error("Internal server error: ", err);
        return NextResponse.json(
            {message: "Internal server error"},
            {status: 500}
        );
    }
};