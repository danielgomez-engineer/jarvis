import TaskCard from "./TaskCard";
import { Task } from "./types";

type BoardCellProps = {
  tasks: Task[];
  isToday: boolean;
  // Read by screen readers, e.g. "Inglés, mié 28"
  label: string;
};

//=====JV-1: ONE CELL = ONE AREA × ONE DAY (or × "Sin fecha")=====
export default function BoardCell({ tasks, isToday, label }: BoardCellProps) {
  return (
    <div
      aria-label={label}
      role="group"
      className={`min-h-16 rounded-panel p-1.5 ${isToday ? "border-t-2 border-accent bg-accent-soft" : "bg-surface-sunken"}`}
    >
      {/* An empty cell stays empty: a "Nada para hoy" in every lane was noise (it returns in the phone view, U2.4.4) */}
      {tasks.length > 0 && (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
