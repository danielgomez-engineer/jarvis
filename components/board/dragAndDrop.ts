import { DataRef } from "@dnd-kit/core";
import { Task, TaskMove } from "./types";

//=====JV-1 (U2.6.2): WHAT TRAVELS WITH A DRAG (desktop board only; the phone moves with "Mover a…")=====
// dnd-kit only knows ids. Each card and each cell attach their own data, and the board reads it back on drop.

// A cell that takes dropped cards: one area × one day (or × "Sin fecha")
export type DropCell = {
  areaId: number;
  // null = "Sin fecha"
  dueDate: string | null;
  // "Inglés, mié 12": what a screen reader hears while a card is over it
  label: string;
};

// The card being dragged
export type DragData = {
  task: Task;
  // The cell it was picked up from: dropping it back there changes nothing
  fromCell: string;
  // The copy shown in "Hoy" as overdue (the same task can also be in its own day)
  showOverdue: boolean;
};

export const cellId = (areaId: number, dueDate: string | null) => `cell:${areaId}:${dueDate ?? "none"}`;

// Pressing here never starts a drag: the check, the "⋯" and the open menu stay plain clicks
export const NOT_A_DRAG_HANDLE = "label, button, input, [popover]";

// What dropping this card on this cell changes: only the keys that change, like "Mover a…" (a drag can change both).
// null = nothing: dropped back where it came from, or on a cell with its same area and day (ordering is U2.6.3).
// One rule for the cell that lights up (BoardCell) and for the drop itself (BoardGrid), so they never disagree.
export function moveFor(drag: DragData, toCell: string, cell: DropCell): TaskMove | null {
  if (toCell === drag.fromCell) return null;

  const move: TaskMove = {};
  if (cell.areaId !== drag.task.areaId) move.areaId = cell.areaId;
  if (cell.dueDate !== drag.task.dueDate) move.dueDate = cell.dueDate;
  return Object.keys(move).length > 0 ? move : null;
}

// dnd-kit keeps the data untyped; these read it back with its type
export const dragDataOf = (item: { data: DataRef }) => item.data.current as DragData | undefined;
export const dropCellOf = (item: { data: DataRef } | null) => item?.data.current as DropCell | undefined;
