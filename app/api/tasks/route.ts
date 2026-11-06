import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { createTaskSchema, taskWeekQuerySchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES, FIELD_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";
import {
  TASK_FIELDS,
  nextPositionInCell,
  placeInWeek,
  serializeTask,
  toDateOnly,
  userOwnsArea,
} from "@/lib/tasks/cells";
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
    const params = new URL(request.url).searchParams;
    const validation = taskWeekQuerySchema.safeParse({
      weekStart: params.get("weekStart"),
      // A missing param arrives as null; undefined = "not sent"
      today: params.get("today") ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          fields: getFieldErrors(validation.error),
        },
        { status: 400 },
      );
    }

    const { weekStart, today } = validation.data;

    const weekFrom = toDateOnly(weekStart);
    const weekTo = toDateOnly(addDays(weekStart, 6));

    // 5. decoded.userId is trustworthy because it came from a token
    //    WE signed — the client can't forge it. Filter tasks by it.
    // JV-1: tasks of that week (Monday to Sunday) + the ones without a date ("Sin fecha")
    //       + overdue ones (before today and not done), even from older weeks: they show up in "Hoy"
    // JV-1 (U2.5.1): + repeated tasks that started by the end of this week. Never overdue:
    //       each week is a new chance, so a missed one doesn't pile up.
    const tasks = await prisma.task.findMany({
      where: {
        userId: authResult.userId,
        OR: [
          { dueDate: null },
          { repeatsWeekly: false, dueDate: { gte: weekFrom, lte: weekTo } },
          ...(today ? [{ repeatsWeekly: false, dueDate: { lt: toDateOnly(today) }, completed: false }] : []),
          { repeatsWeekly: true, dueDate: { lte: weekTo } },
        ],
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      // Only this week's completions: enough to know if this week's day is done
      select: {
        ...TASK_FIELDS,
        completions: { where: { date: { gte: weekFrom, lte: weekTo } }, select: { date: true } },
      },
    });

    // 6. Respond with the task list (repeated ones moved to this week's day)
    return NextResponse.json(
      tasks.map((task) => serializeTask(placeInWeek(task, weekStart))),
      { status: 200 },
    );
  } catch (err) {
    // This outer catch is for real, unexpected server errors
    // (e.g. the database is unreachable) — a genuine 500.
    console.error("Internal Server error", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
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
      return NextResponse.json(
        { code: API_ERROR_CODES.INVALID_JSON },
        { status: 400 },
      );
    }

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          fields: getFieldErrors(validation.error),
        },
        { status: 400 },
      );
    }

    const { title, description, completed, areaId, dueDate, urgent, repeatsWeekly } =
      validation.data;

    // JV-1 (U2.5.1): a repeated task needs a day: its weekday is the one it repeats on
    if (repeatsWeekly && !dueDate) {
      return NextResponse.json(
        {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          fields: { dueDate: FIELD_ERROR_CODES.REQUIRED },
        },
        { status: 400 },
      );
    }

    // JV-1: the area comes from the body, so check it's the user's (404 if not, like tasks)
    if (!(await userOwnsArea(authResult.userId, areaId))) {
      return NextResponse.json(
        { code: API_ERROR_CODES.AREA_NOT_FOUND },
        { status: 404 },
      );
    }

    const dueDay = dueDate ? toDateOnly(dueDate) : null;

    // 5. we put away the task, last in its cell
    const task = await prisma.task.create({
      data: {
        title,
        description,
        completed,
        urgent,
        repeatsWeekly,
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
