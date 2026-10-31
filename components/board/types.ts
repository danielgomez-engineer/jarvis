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
};
