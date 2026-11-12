import { useState } from "react";
import {
  Active,
  CollisionDetection,
  DndContext,
  DndContextProps,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { formatDayLabel, weekDays } from "@/lib/dates/week";
import AreaLane from "./AreaLane";
import { useBoard } from "./BoardContext";
import { DragData, dragDataOf, dropCellOf } from "./dragAndDrop";
import { TaskCardPreview } from "./TaskCard";
import { Area, Task, TaskMove } from "./types";

type BoardGridProps = {
  areas: Area[];
  tasks: Task[];
  weekStart: string;
  today: string;
  onAddTask: (areaId: number) => void;
};

// The 2px bottom border is always there (transparent) so "Hoy" can turn it cyan without moving anything
const COLUMN_HEADER = "border-b-2 px-1.5 pb-1 text-xs font-medium uppercase tracking-wide tabular-nums";

// JV-1 (U2.6.2): the drag starts once the mouse moves 5px, so a plain click on a card is still a click
const MOUSE_OPTIONS = { activationConstraint: { distance: 5 } };

// JV-1 (U2.6.2): the target is the cell under the mouse. A repeated task always needs a day,
// so "Sin fecha" never takes it (same rule as the menu and the API)
const cellUnderMouse: CollisionDetection = (args) => {
  const repeats = dragDataOf(args.active)?.task.repeatsWeekly;
  const droppableContainers = repeats
    ? args.droppableContainers.filter((cell) => dropCellOf(cell)?.dueDate !== null)
    : args.droppableContainers;

  return pointerWithin({ ...args, droppableContainers });
};

const titleOf = (active: Active) => dragDataOf(active)?.task.title ?? "";

// JV-1 (U2.6.2): what a screen reader hears while dragging, in Spanish (dnd-kit's defaults are in English)
const DRAG_ACCESSIBILITY: DndContextProps["accessibility"] = {
  // Never read (cards don't get dnd-kit's attributes, see TaskCard); set so no English text lands in the page
  screenReaderInstructions: { draggable: es.dashboard.board.dragInstructions },
  announcements: {
    onDragStart: ({ active }) => translateText(es.dashboard.board.dragStart, { title: titleOf(active) }),
    // Only over a cell: the gaps between cells would announce "outside" at every step
    onDragOver: ({ active, over }) => {
      const cell = dropCellOf(over);
      return cell ? translateText(es.dashboard.board.dragOver, { title: titleOf(active), cell: cell.label }) : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const cell = dropCellOf(over);
      return cell
        ? translateText(es.dashboard.board.dragDropped, { title: titleOf(active), cell: cell.label })
        : translateText(es.dashboard.board.dragCancel, { title: titleOf(active) });
    },
    onDragCancel: ({ active }) => translateText(es.dashboard.board.dragCancel, { title: titleOf(active) }),
  },
};

//=====JV-1: THE WEEKLY BOARD: one lane per area × ("Sin fecha" + Monday…Sunday)=====
export default function BoardGrid({ areas, tasks, weekStart, today, onAddTask }: BoardGridProps) {
  const { taskActions } = useBoard();
  const days = weekDays(weekStart);
  // JV-1 (U2.6.2): mouse only. The phone shows PhoneBoard instead, and the keyboard moves cards with "Mover a…"
  const sensors = useSensors(useSensor(MouseSensor, MOUSE_OPTIONS));
  // The card being dragged, drawn floating under the mouse
  const [dragged, setDragged] = useState<DragData | null>(null);

  const handleDragStart = ({ active }: DragStartEvent) => setDragged(dragDataOf(active) ?? null);

  // JV-1 (U2.6.2): dropping a card on a cell is the same move as "Mover a…" (page.tsx):
  // optimistic, with "Deshacer", and back to its place with a toast if the server says no
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragged(null);

    const drag = dragDataOf(active);
    const cell = dropCellOf(over);
    // Dropped outside the cells, or back in the cell it came from (ordering inside a cell is U2.6.3)
    if (!drag || !cell || over?.id === drag.fromCell) return;

    // Only what changes, like "Mover a…". A drag can change the area and the day at once
    const move: TaskMove = {};
    if (cell.areaId !== drag.task.areaId) move.areaId = cell.areaId;
    if (cell.dueDate !== drag.task.dueDate) move.dueDate = cell.dueDate;
    if (Object.keys(move).length > 0) taskActions.onMove(drag.task, move);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={cellUnderMouse}
      accessibility={DRAG_ACCESSIBILITY}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      {/* The board scrolls sideways inside its box, never the whole page. Below 640px the page shows PhoneBoard instead. */}
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

      {/* JV-1 (U2.6.2): no drop animation: when the mouse is released the card is already drawn in its new cell (optimistic) */}
      <DragOverlay dropAnimation={null}>
        {dragged && <TaskCardPreview task={dragged.task} showOverdue={dragged.showOverdue} />}
      </DragOverlay>
    </DndContext>
  );
}
