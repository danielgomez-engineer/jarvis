import { useRef } from "react";
import { Bars3BottomLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { formatDayLabel } from "@/lib/dates/week";
import { useBoard } from "./BoardContext";
import TaskMenu, { TaskMenuHandle } from "./TaskMenu";
import { Task } from "./types";

type TaskCardProps = {
  task: Task;
  // Only when the card is shown in "Hoy" as overdue: adds "atrasada · lun 26"
  showOverdue?: boolean;
};

// 300ms is the one animation "with taste" (ESTILOS §2.6); none if the person asked for reduced motion
const COMPLETE_TRANSITION = "transition-colors duration-300 motion-reduce:transition-none";

//=====JV-1: TASK CARD (ESTILOS §4.C)=====
export default function TaskCard({ task, showOverdue = false }: TaskCardProps) {
  const { taskActions } = useBoard();
  const menuRef = useRef<TaskMenuHandle>(null);

  return (
    <li
      // JV-1 (U2.6.1): "m" opens the menu from anywhere in the card (e.g. with the focus on its check)
      onKeyDown={(e) => {
        if ((e.key === "m" || e.key === "M") && !(e.target as HTMLElement).closest("[popover]")) {
          e.preventDefault();
          menuRef.current?.open();
        }
      }}
      className="group flex items-start gap-2 rounded-card border border-line bg-surface px-2 py-1.5 text-sm transition-colors duration-150 hover:border-line-strong"
    >
      {/* JV-1 (U2.4.2): a real checkbox, so a screen reader says "Clase de inglés, casilla, marcada".
          The input is hidden and the circle is drawn; the label makes the whole circle clickable. */}
      <label className="-m-1 shrink-0 cursor-pointer rounded-full p-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-accent">
        <input
          type="checkbox"
          className="sr-only"
          checked={task.completed}
          aria-label={task.title}
          onChange={() => taskActions.onToggleCompleted(task)}
          // Space already toggles a checkbox; "x" is the board shortcut (spec 5)
          onKeyDown={(e) => {
            if (e.key === "x" || e.key === "X") taskActions.onToggleCompleted(task);
          }}
        />
        <span
          aria-hidden="true"
          className={`flex size-4 items-center justify-center rounded-full border ${COMPLETE_TRANSITION} ${task.completed ? "border-success bg-success text-white" : "border-line-strong hover:border-foreground-secondary"}`}
        >
          {task.completed && <CheckIcon className="size-3" strokeWidth={3} />}
        </span>
      </label>

      <div className="min-w-0 flex-1">
        {/* Done = green check + secondary text, no strikethrough (Daniel, 2026-11-01): it reads "done", not "deleted" */}
        <p className={`break-words ${COMPLETE_TRANSITION} ${task.completed ? "text-foreground-secondary" : "text-foreground"} ${task.urgent ? "font-bold" : ""}`}>
          {/* Urgent = position + weight + "!", never a color (spec 4.1 #7). The reader hears "Urgente:", not "!" */}
          {task.urgent && (
            <>
              <span aria-hidden="true">! </span>
              <span className="sr-only">{es.dashboard.board.urgentLabel} </span>
            </>
          )}
          {task.title}
          {/* JV-1 (U2.6.1): the note isn't shown on the card (it would make it huge); a mark says it exists
              and the "⋯" menu shows it in full */}
          {task.description && (
            <>
              <Bars3BottomLeftIcon aria-hidden="true" className="ml-1 inline size-3.5 align-[-2px] text-foreground-secondary" />
              <span className="sr-only"> ({es.dashboard.board.hasNote})</span>
            </>
          )}
          {/* JV-1 (U2.5.2): ↻ = repeats every week. A text mark in secondary color, never an emoji (ESTILOS §2.8, §4.C) */}
          {task.repeatsWeekly && (
            <>
              <span aria-hidden="true" className="ml-1 text-foreground-secondary">
                ↻
              </span>
              <span className="sr-only"> ({es.dashboard.board.repeatsLabel})</span>
            </>
          )}
        </p>

        {/* Overdue = amber + the word "atrasada", never the color alone (ESTILOS §3.6) */}
        {showOverdue && task.dueDate && (
          <p className="text-xs text-attention">
            {es.dashboard.board.overdue} · <span className="font-mono tabular-nums">{formatDayLabel(task.dueDate)}</span>
          </p>
        )}
      </div>

      {/* JV-1 (U2.6.1): one "⋯" with every secondary action (ESTILOS §4.C): move, urgent and delete */}
      <TaskMenu ref={menuRef} task={task} />
    </li>
  );
}
