import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { updateTaskSchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES, FIELD_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";
import { DB_INT_MAX } from "@/lib/validations/limits";
import { TASK_FIELDS, nextPositionInCell, serializeTask, toDateOnly, userOwnsArea } from "@/lib/tasks/cells";
import { sameWeekdayIn } from "@/lib/dates/week";

//===================================================JV-1: UPDATE TASK=================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0 || taskId > DB_INT_MAX) {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_TASK_ID }, { status: 400 });
    }

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

    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { completed, urgent, areaId, dueDate, position, repeatsWeekly } = validation.data;

    // JV-1: read the task first (only if it's the user's) to know its current cell
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: authResult.userId },
      select: { areaId: true, dueDate: true, repeatsWeekly: true },
    });

    if (!task) {
      return NextResponse.json({ code: API_ERROR_CODES.TASK_NOT_FOUND }, { status: 404 });
    }

    if (areaId !== undefined && !(await userOwnsArea(authResult.userId, areaId))) {
      return NextResponse.json({ code: API_ERROR_CODES.AREA_NOT_FOUND }, { status: 404 });
    }

    // JV-1 (U2.5.2): moving a task that keeps repeating changes only its weekday. Its dueDate (the first day)
    // stays in the week it started, so it still shows up in the weeks before and their completions still count.
    const keepsRepeating = task.repeatsWeekly && repeatsWeekly !== false;
    const newDate =
      keepsRepeating && dueDate && task.dueDate ? sameWeekdayIn(task.dueDate.toISOString().slice(0, 10), dueDate) : dueDate;

    // undefined = don't touch the date; null = remove it
    const dueDay = newDate === undefined ? undefined : newDate === null ? null : toDateOnly(newDate);

    const newAreaId = areaId ?? task.areaId;
    const newDueDay = dueDay === undefined ? task.dueDate : dueDay;
    const changesCell = newAreaId !== task.areaId || newDueDay?.getTime() !== task.dueDate?.getTime();

    // JV-1 (U2.5.2): a repeated task needs a day (its weekday is the one it repeats on),
    // so it can't go to "Sin fecha", nor start repeating without a date
    if ((repeatsWeekly ?? task.repeatsWeekly) && newDueDay === null) {
      return NextResponse.json(
        { code: API_ERROR_CODES.VALIDATION_ERROR, fields: { dueDate: FIELD_ERROR_CODES.REQUIRED } },
        { status: 400 },
      );
    }

    // JV-1: moving to another cell without a position → last in the new cell
    const newPosition = position ?? (changesCell ? await nextPositionInCell(newAreaId, newDueDay) : undefined);

    //7. we update away the task (Prisma ignores undefined fields)
    const updatedTask = await prisma.task.update({
      where: { id: taskId, userId: authResult.userId },
      data: { completed, urgent, areaId, dueDate: dueDay, position: newPosition, repeatsWeekly },
      select: TASK_FIELDS,
    });

    return NextResponse.json(serializeTask(updatedTask), { status: 200 });
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}

//===================================================DELETE TASK=================================================

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0 || taskId > DB_INT_MAX) {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_TASK_ID }, { status: 400 });
    }
    const authResult = await validToken();

    // If authentication failed (returns a NextResponse error), halt execution and return it immediately
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const deleteTask = await prisma.task.deleteMany({
      where: {
        id: taskId,
        userId: authResult.userId,
      },
    });

    // check if any row was affected
    if (deleteTask.count === 0) {
      return NextResponse.json({ code: API_ERROR_CODES.TASK_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json(
      { },
      { status: 200 },
    );
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
