import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { createTaskSchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";

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
    console.error("Internal Server error", err);
    return NextResponse.json(
      { code : API_ERROR_CODES.INTERNAL_ERROR },
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
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_JSON }, { status: 400 });
    }

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { title, description, completed } = validation.data;

    // JV-1: until the board lets the person pick an area (U2.3.2), new tasks go to
    // the user's "General" area. upsert = reuse it if it exists, create it if not
    // (new users have no areas yet). Same name as the link_tasks_to_areas migration.
    const generalArea = await prisma.area.upsert({
      where: { userId_name: { userId: authResult.userId, name: "General" } },
      update: {},
      create: { userId: authResult.userId, name: "General" },
    });

    // 5. we put away the task
    await prisma.task.create({
      data: {
        title,
        description,
        completed,
        userId: authResult.userId,
        areaId: generalArea.id,
      },
    });

    return NextResponse.json(
      {},
      { status: 201 },
    );
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
