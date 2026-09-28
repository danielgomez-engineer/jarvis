import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma/prisma";


//=========================================================Valid Token============================================================
export async function validToken(): Promise<NextResponse | { userId: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded; // Return { userId: number }
  } catch (jwtError) {
    return NextResponse.json({ message: "Unauthorized: Invalid or expired token" }, { status: 401 });
  }
}

//=========================================================GET TASK============================================================
export async function GET(request: Request) {
  try {
    //1. check token auxiliar method
    const authResult = await validToken();

    //2. valid response
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 5. decoded.userId is trustworthy because it came from a token
    //    WE signed — the client can't forge it. Filter tasks by it.
    const tasks = await prisma.task.findMany({
      where: { userId: authResult.userId },
    });

    // 6. Respond with the task list.
    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    // This outer catch is for real, unexpected server errors
    // (e.g. the database is unreachable) — a genuine 500.
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ===================================CREATE TASK====================================================================
export async function POST(request: Request) {
  try {
    // 1. Validar el token con el método auxiliar
    const authResult = await validToken();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 2. parse the JSON body safely — request.json() THROWS on empty/malformed bodies
    let body: { title?: string; description?: string; completed?: boolean };
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { message: "Invalid or missing JSON body" },
        { status: 400 },
      );
    }

    // 3. Extraer los datos una vez que el body está validado y protegido
    const { title, description, completed } = body;

    // 4. validate null fields
    if (!title) {
      return NextResponse.json(
        { message: "The title is required" },
        { status: 400 },
      );
    }

    // 5. we put away the task
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        userId: authResult.userId,
      },
    });

    return NextResponse.json(
      { message: "Task register satisfactory" },
      { status: 201 },
    );
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
