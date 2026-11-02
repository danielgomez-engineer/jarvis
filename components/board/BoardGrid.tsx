import { es } from "@/lib/i18n/es";
import { formatDayLabel, weekDays } from "@/lib/dates/week";
import AreaLane from "./AreaLane";
import { Area, Task } from "./types";

type BoardGridProps = {
  areas: Area[];
  tasks: Task[];
  weekStart: string;
  today: string;
  onAddTask: (areaId: number) => void;
};

// The 2px bottom border is always there (transparent) so "Hoy" can turn it cyan without moving anything
const COLUMN_HEADER = "border-b-2 px-1.5 pb-1 text-xs font-medium uppercase tracking-wide tabular-nums";

//=====JV-1: THE WEEKLY BOARD: one lane per area × ("Sin fecha" + Monday…Sunday)=====
export default function BoardGrid({ areas, tasks, weekStart, today, onAddTask }: BoardGridProps) {
  const days = weekDays(weekStart);

  return (
    // The board scrolls sideways inside its box, never the whole page. The phone view arrives in U2.4.4.
    <div className="overflow-x-auto pb-2">
      {/* "Sin fecha" is the inbox, so it gets more room than a single day */}
      <div className="grid min-w-[72rem] grid-cols-[10rem_minmax(0,1.4fr)_repeat(7,minmax(0,1fr))] gap-1.5">
        {/* Header row: empty corner + column names */}
        <div />
        <div className={`${COLUMN_HEADER} border-transparent text-foreground-secondary`}>{es.dashboard.board.noDate}</div>
        {days.map((day) => (
          // Today: the one cyan line of the column, once on its header instead of on every lane
          <div key={day} className={`${COLUMN_HEADER} ${day === today ? "border-accent text-accent-strong" : "border-transparent text-foreground-secondary"}`}>
            {formatDayLabel(day)}
            {day === today && ` · ${es.dashboard.board.todaySuffix}`}
          </div>
        ))}

        {areas.map((area) => (
          <AreaLane key={area.id} area={area} tasks={tasks.filter((task) => task.areaId === area.id)} days={days} today={today} onAddTask={onAddTask} />
        ))}
      </div>
    </div>
  );
}
