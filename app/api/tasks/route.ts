import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { createTaskSchema } from "@/lib/validations/tasks";

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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
    }

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const { title, description, completed } = validation.data;

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
