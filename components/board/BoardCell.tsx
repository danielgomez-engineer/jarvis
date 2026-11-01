import TaskCard from "./TaskCard";
import { Task } from "./types";

type BoardCellProps = {
  tasks: Task[];
  // Only the "Hoy" cell has them: pending tasks from past days, shown on top
  overdueTasks?: Task[];
  isToday: boolean;
  // Read by screen readers, e.g. "Inglés, mié 28"
  label: string;
  onToggleCompleted: (task: Task) => void;
};

//=====JV-1: ONE CELL = ONE AREA × ONE DAY (or × "Sin fecha")=====
export default function BoardCell({ tasks, overdueTasks = [], isToday, label, onToggleCompleted }: BoardCellProps) {
  const hasTasks = overdueTasks.length > 0 || tasks.length > 0;

  return (
    <div
      aria-label={label}
      role="group"
      className={`min-h-16 rounded-panel p-1.5 ${isToday ? "border-t-2 border-accent bg-accent-soft" : "bg-surface-sunken"}`}
    >
      {/* An empty cell stays empty: a "Nada para hoy" in every lane was noise (it returns in the phone view, U2.4.4) */}
      {hasTasks && (
        <ul className="space-y-1">
          {/* "overdue-" prefix: the same task can also be in its own day, so the keys must differ */}
          {overdueTasks.map((task) => (
            <TaskCard key={`overdue-${task.id}`} task={task} onToggleCompleted={onToggleCompleted} showOverdue />
          ))}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggleCompleted={onToggleCompleted} />
          ))}
        </ul>
      )}
    </div>
  );
}
