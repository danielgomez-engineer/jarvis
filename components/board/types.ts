// JV-1: what the board receives from /api/areas and /api/tasks

export type Area = {
  id: number;
  name: string;
  color: number;
  position: number;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  // "YYYY-MM-DD" or null ("Sin fecha")
  dueDate: string | null;
  urgent: boolean;
  position: number;
  areaId: number;
  // JV-1 (U2.5.1): shows up every week on the weekday of its dueDate
  repeatsWeekly: boolean;
};

// JV-1 (U2.6.1): where a task goes. Only the keys that change: { dueDate } or { areaId }
export type TaskMove = {
  dueDate?: string | null;
  areaId?: number;
};

// JV-1 (U2.4.4): the one column the phone shows: "Sin fecha" or a day of the week (0 = Monday … 6 = Sunday).
// An index and not a date, so changing the week keeps the same weekday.
export type DaySlot = "noDate" | number;

// JV-1: what a card can do. The page owns the logic; the cards get it from BoardContext
export type TaskActions = {
  onToggleCompleted: (task: Task) => void;
  onToggleUrgent: (task: Task) => void;
  onMove: (task: Task, move: TaskMove) => void;
  onDelete: (task: Task) => void;
};
