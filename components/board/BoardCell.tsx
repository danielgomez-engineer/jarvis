import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { DropCell, cellId } from "./dragAndDrop";
import TaskCard, { DraggableTaskCard } from "./TaskCard";
import { Task } from "./types";

type BoardCellProps = {
  // Already sorted: pending first, done at the bottom
  tasks: Task[];
  // Only the "Hoy" cell has them: pending tasks from past days, shown on top
  overdueTasks?: Task[];
  isToday: boolean;
  // Read by screen readers, e.g. "Inglés, mié 28"
  label: string;
  // JV-1: in "Sin fecha" the done tasks fold away. A day keeps them: they are that day's record,
  // but the inbox would only grow, week after week.
  foldDone?: boolean;
  // JV-1 (U2.6.2): desktop only, set by DroppableCell: this cell takes dropped cards and its cards can be dragged
  dropId?: string;
  dropRef?: (element: HTMLElement | null) => void;
};

//=====JV-1: ONE CELL = ONE AREA × ONE DAY (or × "Sin fecha")=====
export default function BoardCell({ tasks, overdueTasks = [], isToday, label, foldDone = false, dropId, dropRef }: BoardCellProps) {
  const [showDone, setShowDone] = useState(false);

  const pendingTasks = foldDone ? tasks.filter((task) => !task.completed) : tasks;
  const doneTasks = foldDone ? tasks.filter((task) => task.completed) : [];
  const listed = [...pendingTasks, ...(showDone ? doneTasks : [])];

  // "overdue-" prefix: the same task can also be in its own day, so the keys must differ.
  // JV-1 (U2.6.2): on desktop every card can be dragged out of this cell; the phone keeps plain cards.
  const card = (task: Task, overdue: boolean) => {
    const key = overdue ? `overdue-${task.id}` : String(task.id);
    return dropId ? (
      <DraggableTaskCard key={key} task={task} showOverdue={overdue} fromCell={dropId} />
    ) : (
      <TaskCard key={key} task={task} showOverdue={overdue} />
    );
  };

  return (
    <div
      ref={dropRef}
      aria-label={label}
      role="group"
      // "Hoy" is only the soft background here; its cyan line lives once, on the column header (BoardGrid).
      // Fixed height only on desktop, where empty cells keep the grid even; the phone only draws cells with tasks.
      className={`space-y-1 sm:min-h-16 rounded-panel p-1.5 ${isToday ? "bg-accent-soft" : "bg-surface-sunken"}`}
    >
      {/* An empty cell stays empty: a "Nada para hoy" in every lane was noise (the phone shows it once per day, PhoneBoard) */}
      {(overdueTasks.length > 0 || listed.length > 0) && (
        <ul className="space-y-1">
          {overdueTasks.map((task) => card(task, true))}
          {listed.map((task) => card(task, false))}
        </ul>
      )}

      {doneTasks.length > 0 && (
        <button
          type="button"
          aria-expanded={showDone}
          onClick={() => setShowDone((current) => !current)}
          className="flex items-center gap-1 rounded-control px-1 py-0.5 text-xs max-sm:min-h-11 text-foreground-secondary transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={`size-3.5 transition-transform duration-150 motion-reduce:transition-none ${showDone ? "rotate-180" : ""}`}
          />
          {showDone
            ? es.dashboard.board.hideDone
            : doneTasks.length === 1
              ? es.dashboard.board.showDoneOne
              : translateText(es.dashboard.board.showDoneMany, { count: doneTasks.length })}
        </button>
      )}
    </div>
  );
}

type DroppableCellProps = Omit<BoardCellProps, "dropId" | "dropRef"> & {
  areaId: number;
  // null = "Sin fecha"
  dueDate: string | null;
};

//=====JV-1 (U2.6.2): A DESKTOP CELL THAT TAKES DROPPED CARDS=====
// A wrapper, so the phone (which also draws BoardCell) never touches dnd-kit
export function DroppableCell({ areaId, dueDate, ...cellProps }: DroppableCellProps) {
  const id = cellId(areaId, dueDate);
  const data: DropCell = { areaId, dueDate, label: cellProps.label };
  const { setNodeRef } = useDroppable({ id, data });

  return <BoardCell {...cellProps} dropId={id} dropRef={setNodeRef} />;
}
