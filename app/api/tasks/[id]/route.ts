import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { updatedCompletedTaskSchema } from "@/lib/validations/tasks";

//===================================================UPDATE COMPLETED TASK=================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
    }

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

    const validation = updatedCompletedTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
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
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Task Update Satisfactory" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
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
      return NextResponse.json({ message: "invalid task id" }, { status: 400 });
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
      return NextResponse.json({ message: "Task Not Found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Task Delete satisfactory" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json(
      { message: "Internal Server error" },
      { status: 500 },
    );
  }
}
