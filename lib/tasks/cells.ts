import { prisma } from "@/lib/prisma/prisma";

//=====JV-1: HELPERS FOR TASKS ON THE BOARD=====

// Fields the UI needs; never userId or timestamps
export const TASK_FIELDS = {
  id: true,
  title: true,
  description: true,
  completed: true,
  dueDate: true,
  urgent: true,
  position: true,
  areaId: true,
} as const;

// "2026-10-31" → midnight UTC. The column is DATE, so Postgres keeps only the day.
export function toDateOnly(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

// A board cell is area × day (or area × "no date"). A new or moved task goes last.
export async function nextPositionInCell(areaId: number, dueDate: Date | null): Promise<number> {
  return prisma.task.count({ where: { areaId, dueDate } });
}

// The area must exist AND belong to the user; otherwise it's "not found" for them
export async function userOwnsArea(userId: number, areaId: number): Promise<boolean> {
  const area = await prisma.area.findFirst({ where: { id: areaId, userId }, select: { id: true } });
  return area !== null;
}
