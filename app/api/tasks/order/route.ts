import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { reorderTasksSchema } from "@/lib/validations/tasks";
import { getFieldErrors } from "@/lib/validations/fieldErrors";
import { repeatsOn, toDateOnly, userOwnsArea } from "@/lib/tasks/cells";

//=========================================================JV-1 (U2.6.3): REORDER THE TASKS OF ONE CELL============================================================
// PUT because the body REPLACES the cell's whole order: { areaId: 2, dueDate: "2026-11-20", ids: [7, 3, 9] } → position 0, 1, 2.
// Same pattern as PUT /api/areas/order (U2.2.2).
export async function PUT(request: Request) {
  try {
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

    const validation = reorderTasksSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) },
        { status: 400 },
      );
    }

    const { areaId, dueDate, ids } = validation.data;

    // Each task once: a repeated id would give one task two positions
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_TASK_ORDER }, { status: 400 });
    }

    // A task that isn't this user's: reject everything (404, not 403, so nobody learns which ids exist)
    const ownedCount = await prisma.task.count({ where: { id: { in: ids }, userId: authResult.userId } });
    if (ownedCount !== ids.length) {
      return NextResponse.json({ code: API_ERROR_CODES.TASK_NOT_FOUND }, { status: 404 });
    }

    if (!(await userOwnsArea(authResult.userId, areaId))) {
      return NextResponse.json({ code: API_ERROR_CODES.AREA_NOT_FOUND }, { status: 404 });
    }

    // What the cell holds today. A repeated task keeps its FIRST day as dueDate, so it belongs to a day
    // when it falls on its weekday and has already started (repeatsOn), not by the exact date.
    const day = dueDate === null ? null : toDateOnly(dueDate);
    const candidates = await prisma.task.findMany({
      where: {
        userId: authResult.userId,
        areaId,
        ...(day === null
          ? { dueDate: null }
          : { OR: [{ repeatsWeekly: false, dueDate: day }, { repeatsWeekly: true, dueDate: { lte: day } }] }),
      },
      select: { id: true, repeatsWeekly: true, dueDate: true },
    });
    const cellIds = new Set(
      candidates.filter((task) => !task.repeatsWeekly || (day !== null && repeatsOn(task, day))).map((task) => task.id),
    );

    // Must be exactly that cell: a missing or extra task means the page was stale (e.g. a task was added in another tab),
    // and saving it would leave two tasks sharing a position
    if (ids.length !== cellIds.size || ids.some((id) => !cellIds.has(id))) {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_TASK_ORDER }, { status: 400 });
    }

    // Transaction: all positions change or none do, never a half-saved order
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.task.update({
          where: { id, userId: authResult.userId },
          data: { position: index },
        }),
      ),
    );

    // Only what changed: the board already has everything else
    return NextResponse.json(ids.map((id, index) => ({ id, position: index })), { status: 200 });
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
