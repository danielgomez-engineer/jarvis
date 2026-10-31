import { CheckIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { Task } from "./types";

//=====JV-1: TASK CARD (ESTILOS §4.C)=====
// The check only SHOWS the state for now; pressing it to complete arrives in U2.4.2.
export default function TaskCard({ task }: { task: Task }) {
  return (
    <li className="flex items-start gap-2 rounded-card border border-line bg-surface px-2 py-1.5 text-sm transition-colors duration-150 hover:border-line-strong">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${task.completed ? "border-success bg-success text-white" : "border-line-strong"}`}
      >
        {task.completed && <CheckIcon className="size-3" strokeWidth={3} />}
      </span>

      <span className={`min-w-0 break-words ${task.completed ? "text-foreground-muted line-through" : "text-foreground"} ${task.urgent ? "font-bold" : ""}`}>
        {/* Urgent = position + weight + "!", never a color (spec 4.1 #7) */}
        {task.urgent && <span>! </span>}
        {task.title}
        {task.completed && <span className="sr-only"> ({es.dashboard.board.completedLabel})</span>}
      </span>
    </li>
  );
}
