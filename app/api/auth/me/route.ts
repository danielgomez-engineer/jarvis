import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { API_ERROR_CODES } from "@/lib/errors/codes";


export async function GET(request: Request) {
    try {
            // 1. check token auxiliar method
    const authResult = await validToken();

    // 2. VALID REsponse
    if(authResult instanceof NextResponse) { 
        return authResult;
    }

    // 3. decoded.userId is trust 
    const user = await prisma.user.findUnique({
        where: {
            id: authResult.userId 
        },
        select: {
            name: true
        }
    });
    
    if(!user) {
        return NextResponse.json(
            { code: API_ERROR_CODES.USER_NOT_FOUND },
            {status: 404}
        );
    }

    // 4. respond with the user name
    return NextResponse.json(user, { status: 200 });

    } catch (err) {
        console.error("Internal Server error: ", err);
        return NextResponse.json(
            { code: API_ERROR_CODES.INTERNAL_ERROR},
            {status: 500}
        );
    }
}