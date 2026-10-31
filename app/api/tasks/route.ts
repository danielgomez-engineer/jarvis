import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { createTaskSchema, taskWeekQuerySchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";
import { TASK_FIELDS, nextPositionInCell, serializeTask, toDateOnly, userOwnsArea } from "@/lib/tasks/cells";
import { addDays } from "@/lib/dates/week";

//=========================================================GET TASK============================================================
export async function GET(request: Request) {
  try {
    //1. check token auxiliar method
    const authResult = await validToken();

    //2. valid response
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // JV-1: the board asks for one week at a time
    const validation = taskWeekQuerySchema.safeParse({
      weekStart: new URL(request.url).searchParams.get("weekStart"),
    });

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { weekStart } = validation.data;

    // 5. decoded.userId is trustworthy because it came from a token
    //    WE signed — the client can't forge it. Filter tasks by it.
    // JV-1: tasks of that week (Monday to Sunday) + the ones without a date ("Sin fecha")
    const tasks = await prisma.task.findMany({
      where: {
        userId: authResult.userId,
        OR: [
          { dueDate: null },
          { dueDate: { gte: toDateOnly(weekStart), lte: toDateOnly(addDays(weekStart, 6)) } },
        ],
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: TASK_FIELDS,
    });

    // 6. Respond with the task list.
    return NextResponse.json(tasks.map(serializeTask), { status: 200 });
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

    const { title, description, completed, areaId, dueDate, urgent } = validation.data;

    // JV-1: the area comes from the body, so check it's the user's (404 if not, like tasks)
    if (!(await userOwnsArea(authResult.userId, areaId))) {
      return NextResponse.json({ code: API_ERROR_CODES.AREA_NOT_FOUND }, { status: 404 });
    }

    const dueDay = dueDate ? toDateOnly(dueDate) : null;

    // 5. we put away the task, last in its cell
    const task = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        urgent,
        dueDate: dueDay,
        position: await nextPositionInCell(areaId, dueDay),
        userId: authResult.userId,
        areaId,
      },
      select: TASK_FIELDS,
    });

    return NextResponse.json(serializeTask(task), { status: 201 });
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
