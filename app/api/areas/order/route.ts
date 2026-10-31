import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { reorderAreasSchema } from "@/lib/validations/areas";
import { getFieldErrors } from "@/lib/validations/fieldErrors";

//=========================================================JV-1: REORDER AREAS============================================================
// PUT because the body REPLACES the whole order: { ids: [3, 1, 2] } → position 0, 1, 2
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

    const validation = reorderAreasSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) },
        { status: 400 },
      );
    }

    const { ids } = validation.data;

    const userAreas = await prisma.area.findMany({
      where: { userId: authResult.userId },
      select: { id: true },
    });
    const userAreaIds = new Set(userAreas.map((area) => area.id));

    // An id that isn't one of this user's areas: reject everything (404, not 403,
    // so nobody can find out which ids exist for other users)
    if (ids.some((id) => !userAreaIds.has(id))) {
      return NextResponse.json({ code: API_ERROR_CODES.AREA_NOT_FOUND }, { status: 404 });
    }

    // Must be the full list, each area once: a partial or repeated list would leave
    // two areas sharing a position (e.g. the page was stale and an area was added meanwhile)
    if (new Set(ids).size !== ids.length || ids.length !== userAreaIds.size) {
      return NextResponse.json({ code: API_ERROR_CODES.INVALID_AREA_ORDER }, { status: 400 });
    }

    // Transaction: all positions change or none do, never a half-saved order
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.area.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    const areas = await prisma.area.findMany({
      where: { userId: authResult.userId },
      orderBy: { position: "asc" },
      select: { id: true, name: true, color: true, position: true },
    });

    return NextResponse.json(areas, { status: 200 });
  } catch (err) {
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
