import { PlusIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { formatDayLabel } from "@/lib/dates/week";
import AreaDot from "./AreaDot";
import BoardCell from "./BoardCell";
import { Area, Task } from "./types";

type AreaLaneProps = {
  area: Area;
  // This area's tasks: the week's + the ones without a date + overdue ones from any week
  tasks: Task[];
  days: string[];
  today: string;
  // Opens "Nueva tarea" already pointing to this area
  onAddTask: (areaId: number) => void;
  onToggleCompleted: (task: Task) => void;
};

// Inside a cell: pending before done (done ones sink to the bottom), then urgent first, then the manual order (spec 4.2)
function sortForCell(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || Number(b.urgent) - Number(a.urgent) || a.position - b.position,
  );
}

//=====JV-1: LANE = ONE ROW OF THE BOARD (an area across "Sin fecha" + 7 days)=====
// Returns its cells without a wrapper so they sit directly in the board's grid.
// "YYYY-MM-DD" strings sort like dates, so the oldest overdue task goes first
function sortOverdue(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}

export default function AreaLane({ area, tasks, days, today, onAddTask, onToggleCompleted }: AreaLaneProps) {
  // Only this week's days count for the progress (overdue tasks from older weeks don't)
  const weekTasks = tasks.filter((task) => task.dueDate !== null && days.includes(task.dueDate));
  // Overdue = a past day and not done (spec 4.2). Calculated here, never stored.
  const overdueTasks = sortOverdue(tasks.filter((task) => task.dueDate !== null && task.dueDate < today && !task.completed));
  const undatedTasks = tasks.filter((task) => task.dueDate === null);
  // Nothing visible in the lane this week (overdue ones only show when "Hoy" is in this week)
  const isEmpty = weekTasks.length === 0 && undatedTasks.length === 0 && (!days.includes(today) || overdueTasks.length === 0);
  const doneCount = weekTasks.filter((task) => task.completed).length;

  return (
    <>
      <div className="flex flex-col gap-1 py-1.5 pr-2">
        <div className="flex items-start gap-2">
          {/* mt: centers the 8px dot on the first 20px line of the name */}
          <span className="mt-1.5 flex">
            <AreaDot color={area.color} />
          </span>
          {/* h2: the page h1 is "Tablero de la semana". Up to 2 lines so a 40-character name can be read */}
          <h2 title={area.name} className="min-w-0 line-clamp-2 break-words text-sm font-medium text-foreground">
            {area.name}
          </h2>
          <div className="ml-auto flex items-center gap-1">
            {weekTasks.length > 0 && (
              <span
                title={translateText(es.dashboard.board.progressLabel, { done: doneCount, total: weekTasks.length })}
                className="font-mono text-xs tabular-nums text-foreground-secondary"
              >
                {doneCount}/{weekTasks.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => onAddTask(area.id)}
              aria-label={translateText(es.dashboard.board.addTaskIn, { area: area.name })}
              title={translateText(es.dashboard.board.addTaskIn, { area: area.name })}
              className="rounded-control p-1 text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
        </div>
        {isEmpty && <p className="text-xs text-foreground-secondary">{es.dashboard.board.laneEmpty}</p>}
      </div>

      <BoardCell
        tasks={sortForCell(undatedTasks)}
        isToday={false}
        label={translateText(es.dashboard.board.cellLabel, { area: area.name, day: es.dashboard.board.noDate })}
        onToggleCompleted={onToggleCompleted}
      />

      {days.map((day) => (
        <BoardCell
          key={day}
          tasks={sortForCell(tasks.filter((task) => task.dueDate === day))}
          // Overdue tasks also show up in "Hoy", on top of the area (spec 2.1)
          overdueTasks={day === today ? overdueTasks : undefined}
          isToday={day === today}
          onToggleCompleted={onToggleCompleted}
          label={translateText(es.dashboard.board.cellLabel, { area: area.name, day: formatDayLabel(day) })}
        />
      ))}
    </>
  );
}
