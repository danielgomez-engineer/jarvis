import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { updatedCompletedTaskSchema } from "@/lib/validations/tasks";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { getFieldErrors } from "@/lib/validations/fieldErrors";

//===================================================UPDATE COMPLETED TASK=================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
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

    const validation = updatedCompletedTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) }, { status: 400 });
    }

    const { completed } = validation.data;

    //7. we update away the task
    const taskUpdate = await prisma.task.updateMany({
      where: {
        id: taskId,
        userId: authResult.userId,
      },
      data: {
        completed,
      },
    });

    // Check if any row was affected
    if (taskUpdate.count === 0) {
      return NextResponse.json({ code: API_ERROR_CODES.TASK_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json(
      {  },
      { status: 200 },
    );
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

    if (!Number.isInteger(taskId) || taskId <= 0) {
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
