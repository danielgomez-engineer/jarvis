import { PlusIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { formatDayLabel } from "@/lib/dates/week";
import AreaDot from "./AreaDot";
import BoardCell from "./BoardCell";
import { Area, Task } from "./types";

type AreaLaneProps = {
  area: Area;
  // This area's tasks: the week's + the ones without a date
  tasks: Task[];
  days: string[];
  today: string;
  // Opens "Nueva tarea" already pointing to this area
  onAddTask: (areaId: number) => void;
};

// Inside a cell: urgent first, then the manual order (spec 4.2)
function sortForCell(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.position - b.position);
}

//=====JV-1: LANE = ONE ROW OF THE BOARD (an area across "Sin fecha" + 7 days)=====
// Returns its cells without a wrapper so they sit directly in the board's grid.
export default function AreaLane({ area, tasks, days, today, onAddTask }: AreaLaneProps) {
  const weekTasks = tasks.filter((task) => task.dueDate !== null);
  const doneCount = weekTasks.filter((task) => task.completed).length;

  return (
    <>
      <div className="flex flex-col gap-1 py-1.5 pr-2">
        <div className="flex items-center gap-2">
          <AreaDot color={area.color} />
          <h3 className="min-w-0 truncate text-sm font-medium text-foreground">{area.name}</h3>
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
        {tasks.length === 0 && <p className="text-xs text-foreground-secondary">{es.dashboard.board.laneEmpty}</p>}
      </div>

      <BoardCell
        tasks={sortForCell(tasks.filter((task) => task.dueDate === null))}
        isToday={false}
        label={translateText(es.dashboard.board.cellLabel, { area: area.name, day: es.dashboard.board.noDate })}
      />

      {days.map((day) => (
        <BoardCell
          key={day}
          tasks={sortForCell(tasks.filter((task) => task.dueDate === day))}
          isToday={day === today}
          label={translateText(es.dashboard.board.cellLabel, { area: area.name, day: formatDayLabel(day) })}
        />
      ))}
    </>
  );
}
