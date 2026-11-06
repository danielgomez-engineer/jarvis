import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { daySchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES, FIELD_ERROR_CODES } from "@/lib/errors/codes";
import { DB_INT_MAX } from "@/lib/validations/limits";
import { toDateOnly } from "@/lib/tasks/cells";

type Params = { params: Promise<{ id: string; date: string }> };

// JV-1 (U2.5.1): PUT and DELETE check the same things: a valid id and day, a session,
// and a repeated task of this user that falls on that day. Returns the error to answer, or what they need.
async function findRepeatDay(params: Params["params"]) {
  const { id, date } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0 || taskId > DB_INT_MAX) {
    return NextResponse.json({ code: API_ERROR_CODES.INVALID_TASK_ID }, { status: 400 });
  }

  if (!daySchema.safeParse(date).success) {
    return NextResponse.json(
      { code: API_ERROR_CODES.VALIDATION_ERROR, fields: { date: FIELD_ERROR_CODES.INVALID_FORMAT } },
      { status: 400 },
    );
  }

  const authResult = await validToken();
  if (authResult instanceof NextResponse) return authResult;

  // Only if it's the user's: 404 otherwise, like every task route
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: authResult.userId },
    select: { repeatsWeekly: true, dueDate: true },
  });

  if (!task) {
    return NextResponse.json({ code: API_ERROR_CODES.TASK_NOT_FOUND }, { status: 404 });
  }

  // It must repeat, on that weekday, and not before its first day (dueDate)
  const day = toDateOnly(date);
  const isRepeatDay =
    task.repeatsWeekly &&
    task.dueDate !== null &&
    day.getTime() >= task.dueDate.getTime() &&
    day.getUTCDay() === task.dueDate.getUTCDay();

  if (!isRepeatDay) {
    return NextResponse.json({ code: API_ERROR_CODES.NOT_A_REPEAT_DAY }, { status: 400 });
  }

  return { taskId, day };
}

//=====JV-1 (U2.5.1): MARK A REPEATED TASK DONE ON ONE DAY=====
// PUT, not POST: doing it twice leaves the same single row, so a double click is harmless
export async function PUT(_: Request, { params }: Params) {
  try {
    const found = await findRepeatDay(params);
    if (found instanceof NextResponse) return found;

    await prisma.taskCompletion.upsert({
      where: { taskId_date: { taskId: found.taskId, date: found.day } },
      create: { taskId: found.taskId, date: found.day },
      update: {},
    });

    return NextResponse.json({}, { status: 200 });
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json({ code: API_ERROR_CODES.INTERNAL_ERROR }, { status: 500 });
  }
}

//=====JV-1 (U2.5.1): BACK TO PENDING ON THAT DAY=====
export async function DELETE(_: Request, { params }: Params) {
  try {
    const found = await findRepeatDay(params);
    if (found instanceof NextResponse) return found;

    // Already pending is fine too: the result is the same
    await prisma.taskCompletion.deleteMany({ where: { taskId: found.taskId, date: found.day } });

    return NextResponse.json({}, { status: 200 });
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json({ code: API_ERROR_CODES.INTERNAL_ERROR }, { status: 500 });
  }
}
