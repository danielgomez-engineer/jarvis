import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/prisma";
import { validToken } from "@/lib/auth/token";
import { API_ERROR_CODES } from "@/lib/errors/codes";
import { createAreaSchema } from "@/lib/validations/areas";
import { getFieldErrors } from "@/lib/validations/fieldErrors";
import { AREA_COLOR_COUNT } from "@/lib/validations/limits";

// Fields the UI needs; never userId or timestamps
const AREA_FIELDS = { id: true, name: true, color: true, position: true } as const;

//=========================================================JV-1: GET AREAS============================================================
export async function GET() {
  try {
    const authResult = await validToken();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Only the areas of the user in the token, in their manual order
    const areas = await prisma.area.findMany({
      where: { userId: authResult.userId },
      orderBy: { position: "asc" },
      select: AREA_FIELDS,
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

//=========================================================JV-1: CREATE AREA============================================================
export async function POST(request: Request) {
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

    const validation = createAreaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { code: API_ERROR_CODES.VALIDATION_ERROR, fields: getFieldErrors(validation.error) },
        { status: 400 },
      );
    }

    const { name, color } = validation.data;

    // New areas go at the end of the list. The count also rotates the default
    // color (1, 2, … 6, 1, …) so consecutive areas don't share a color.
    const areaCount = await prisma.area.count({
      where: { userId: authResult.userId },
    });

    // userId comes from the token, never from the body: nobody can create areas for someone else
    const area = await prisma.area.create({
      data: {
        name,
        color: color ?? (areaCount % AREA_COLOR_COUNT) + 1,
        position: areaCount,
        userId: authResult.userId,
      },
      select: AREA_FIELDS,
    });

    // Returns the new area so the UI can select it right away
    return NextResponse.json(area, { status: 201 });
  } catch (err) {
    // @@unique([userId, name]): this user already has an area with that name
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { code: API_ERROR_CODES.AREA_ALREADY_EXISTS },
        { status: 409 },
      );
    }
    console.error("Internal server error: ", err);
    return NextResponse.json(
      { code: API_ERROR_CODES.INTERNAL_ERROR },
      { status: 500 },
    );
  }
}
