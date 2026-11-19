import { useEffect, useState } from "react";
import {
  Active,
  CollisionDetection,
  DndContext,
  DndContextProps,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  SensorDescriptor,
  SensorOptions,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { formatDayLabel, weekDays } from "@/lib/dates/week";
import AreaLane from "./AreaLane";
import { useBoard } from "./BoardContext";
import { DragData, dragDataOf, dropCellOf, moveFor } from "./dragAndDrop";
import { TaskCardPreview } from "./TaskCard";
import { Area, Task } from "./types";

type BoardGridProps = {
  areas: Area[];
  tasks: Task[];
  weekStart: string;
  today: string;
  onAddTask: (areaId: number) => void;
  // JV-1 (U2.6.2): true while another week loads
  dragDisabled?: boolean;
};

// The 2px bottom border is always there (transparent) so "Hoy" can turn it cyan without moving anything
const COLUMN_HEADER = "border-b-2 px-1.5 pb-1 text-xs font-medium uppercase tracking-wide tabular-nums";

// JV-1 (U2.6.2): the drag starts once the mouse moves 5px, so a plain click on a card is still a click
const MOUSE_OPTIONS = { activationConstraint: { distance: 5 } };
const NO_SENSORS: SensorDescriptor<SensorOptions>[] = [];

// JV-1 (U2.6.2): below ~1150px the board scrolls sideways inside its box, and dnd-kit scrolls it on its own
// when the card nears an edge. The cells are measured again as it scrolls, so the one under the mouse stays right.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

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
export default function BoardGrid({ areas, tasks, weekStart, today, onAddTask, dragDisabled = false }: BoardGridProps) {
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
    // Dropped outside the cells
    if (!drag || !cell || !over) return;

    const move = moveFor(drag, String(over.id), cell);
    if (move) taskActions.onMove(drag.task, move, "drag");
  };

  // JV-1 (U2.6.2): while a card is dragged, the whole page shows the closed hand (app/globals.css).
  // The floating copy is inert, so the cursor would otherwise come from whatever is under it.
  useEffect(() => {
    if (!dragged) return;

    const root = document.documentElement;
    root.setAttribute("data-dragging", "");
    return () => root.removeAttribute("data-dragging");
  }, [dragged]);

  return (
    <DndContext
      // No sensors = no card can be picked up
      sensors={dragDisabled ? NO_SENSORS : sensors}
      collisionDetection={cellUnderMouse}
      measuring={MEASURING}
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

      {/* JV-1 (U2.6.2): no drop animation, on purpose: when the mouse is released the card is already drawn in its
          new cell (optimistic), so a flight there would show it twice. It also leaves nothing to reduce for reduced motion. */}
      <DragOverlay dropAnimation={null}>
        {dragged && <TaskCardPreview task={dragged.task} showOverdue={dragged.showOverdue} />}
      </DragOverlay>
    </DndContext>
  );
}
