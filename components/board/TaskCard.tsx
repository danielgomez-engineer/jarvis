import { CheckIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { formatDayLabel } from "@/lib/dates/week";
import { Task } from "./types";

type TaskCardProps = {
  task: Task;
  onToggleCompleted: (task: Task) => void;
  // Only when the card is shown in "Hoy" as overdue: adds "atrasada · lun 26"
  showOverdue?: boolean;
};

// 300ms is the one animation "with taste" (ESTILOS §2.6); none if the person asked for reduced motion
const COMPLETE_TRANSITION = "transition-colors duration-300 motion-reduce:transition-none";

//=====JV-1: TASK CARD (ESTILOS §4.C)=====
export default function TaskCard({ task, onToggleCompleted, showOverdue = false }: TaskCardProps) {
  return (
    <li className="flex items-start gap-2 rounded-card border border-line bg-surface px-2 py-1.5 text-sm transition-colors duration-150 hover:border-line-strong">
      {/* JV-1 (U2.4.2): a real checkbox, so a screen reader says "Clase de inglés, casilla, marcada".
          The input is hidden and the circle is drawn; the label makes the whole circle clickable. */}
      <label className="-m-1 shrink-0 cursor-pointer rounded-full p-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-accent">
        <input
          type="checkbox"
          className="sr-only"
          checked={task.completed}
          aria-label={task.title}
          onChange={() => onToggleCompleted(task)}
          // Space already toggles a checkbox; "x" is the board shortcut (spec 5)
          onKeyDown={(e) => {
            if (e.key === "x" || e.key === "X") onToggleCompleted(task);
          }}
        />
        <span
          aria-hidden="true"
          className={`flex size-4 items-center justify-center rounded-full border ${COMPLETE_TRANSITION} ${task.completed ? "border-success bg-success text-white" : "border-line-strong hover:border-foreground-secondary"}`}
        >
          {task.completed && <CheckIcon className="size-3" strokeWidth={3} />}
        </span>
      </label>

      <div className="min-w-0">
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
        </p>

        {/* Overdue = amber + the word "atrasada", never the color alone (ESTILOS §3.6) */}
        {showOverdue && task.dueDate && (
          <p className="text-xs text-attention">
            {es.dashboard.board.overdue} · <span className="font-mono tabular-nums">{formatDayLabel(task.dueDate)}</span>
          </p>
        )}
      </div>
    </li>
  );
}
