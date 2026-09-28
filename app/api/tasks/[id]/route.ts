import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "../route";

//===================================================UPDATE COMPLETED TASK=================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const authResult = await validToken();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    //5. parse the JSON body safely — request.json() THROWS on empty/malformed
    //   bodies (same reasoning as jwt.verify above), so it needs its own try/catch.
    let body: { completed?: unknown };
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { message: "Invalid or missing JSON body" },
        { status: 400 },
      );
    }

    const { completed } = body;

    //6. validate the TYPE of "completed", not just its truthiness —
    //   `if (!completed)` would wrongly reject a legitimate `completed: false`.
    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { message: "The field 'completed' must be a boolean (true or false)" },
        { status: 400 },
      );
    }

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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const taskId = parseInt(id);
    const authResult = await validToken();

    // If authentication failed (returns a NextResponse error), halt execution and return it immediately
    if(authResult instanceof NextResponse) {
      return authResult;
    }

    const deleteTask = await prisma.task.deleteMany({
      where: {
        id: taskId,
        userId: authResult.userId,
      },
    });

    // check if any row was affected
    if(deleteTask.count === 0) {
      return NextResponse.json ({message: "Task Not Found"}, {status: 404});
    }

    return NextResponse.json({message: "Task Delete satisfactory"}, {status: 200});
  } catch (err) {
    console.error("Internal Server error: ", err);
    return NextResponse.json({message: "Internal Server error"}, {status: 500});
  }
}
