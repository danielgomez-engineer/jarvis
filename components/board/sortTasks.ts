import { Task } from "./types";

// JV-1: shared by the desktop lanes and the phone sections, so both show a cell in the same order

// Inside a cell: pending before done (done ones sink to the bottom), then urgent first, then the manual order (spec 4.2)
export function sortForCell(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || Number(b.urgent) - Number(a.urgent) || a.position - b.position,
  );
}

// Overdue = a past day and not done (spec 4.2). Calculated here, never stored.
// "YYYY-MM-DD" strings sort like dates, so the oldest overdue task goes first
export function overdueOf(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((task) => task.dueDate !== null && task.dueDate < today && !task.completed)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}
