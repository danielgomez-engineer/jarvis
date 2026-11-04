"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, InboxIcon, PlusIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { dayOfMonth, formatDayLabel, formatWeekdayLetter, weekDays } from "@/lib/dates/week";
import AreaDot from "./AreaDot";
import BoardCell from "./BoardCell";
import { overdueOf, sortForCell } from "./sortTasks";
import { Area, DaySlot, Task } from "./types";

type PhoneBoardProps = {
  areas: Area[];
  tasks: Task[];
  weekStart: string;
  today: string;
  slot: DaySlot;
  onSelectSlot: (slot: DaySlot) => void;
  onAddTask: (areaId: number) => void;
};

// The strip's order, left to right; ←/→ walk it
export const DAY_SLOTS: DaySlot[] = ["noDate", 0, 1, 2, 3, 4, 5, 6];

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const FOLDED_KEY = "jarvis.foldedAreas";

// Folded areas live in this browser only: it's how this screen looks here, not data worth a request (spec U2.4.4).
// localStorage can be blocked (private mode): then nothing is remembered, and nothing breaks.
function readFolded(): number[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function saveFolded(ids: number[]) {
  try {
    localStorage.setItem(FOLDED_KEY, JSON.stringify(ids));
  } catch {
    // Not saved: the only cost is that the folds are forgotten on reload
  }
}

//=====JV-1 (U2.4.4): PHONE VIEW = ONE DAY AT A TIME, AREAS AS FOLDABLE SECTIONS (spec 2.2)=====
export default function PhoneBoard({ areas, tasks, weekStart, today, slot, onSelectSlot, onAddTask }: PhoneBoardProps) {
  const [folded, setFolded] = useState<number[]>(readFolded);

  const days = weekDays(weekStart);
  // null = "Sin fecha": it matches the tasks whose dueDate is null
  const day = slot === "noDate" ? null : days[slot];
  const isToday = day === today;

  const toggleFold = (areaId: number) => {
    const next = folded.includes(areaId) ? folded.filter((id) => id !== areaId) : [...folded, areaId];
    setFolded(next);
    saveFolded(next);
  };

  const sections = areas.map((area) => {
    const areaTasks = tasks.filter((task) => task.areaId === area.id);
    return {
      area,
      tasks: sortForCell(areaTasks.filter((task) => task.dueDate === day)),
      // Overdue tasks also show up in "Hoy", on top of their area (spec 2.1)
      overdue: isToday ? overdueOf(areaTasks, today) : [],
    };
  });

  // One message for the whole day, not one per area (that was noise on desktop)
  const isEmpty = sections.every((section) => section.tasks.length === 0 && section.overdue.length === 0);
  const emptyText = day === null ? es.dashboard.phone.emptyNoDate : isToday ? es.dashboard.phone.emptyToday : es.dashboard.phone.emptyDay;

  const slotName = (option: DaySlot) => {
    if (option === "noDate") return es.dashboard.board.noDate;
    const optionDay = days[option];
    return optionDay === today ? `${formatDayLabel(optionDay)} · ${es.dashboard.board.todaySuffix}` : formatDayLabel(optionDay);
  };

  return (
    <div className="space-y-3">
      {/* [📥] L M X J V S D. Same tab look as the area selector: the chosen one is underlined (ESTILOS §4.E),
          today's text is cyan (the present, ESTILOS rule 1) */}
      <div role="group" aria-label={es.dashboard.phone.dayPicker} className="grid grid-cols-8">
        {DAY_SLOTS.map((option) => {
          const selected = option === slot;
          const optionDay = option === "noDate" ? null : days[option];
          const optionIsToday = optionDay === today;
          const color = optionIsToday ? "text-accent-strong" : selected ? "text-foreground" : "text-foreground-secondary hover:text-foreground";

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              aria-label={slotName(option)}
              onClick={() => onSelectSlot(option)}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-t-control border-b-2 text-xs transition-colors duration-150 ${selected ? "border-accent font-medium" : "border-transparent"} ${color} ${FOCUS_RING}`}
            >
              {optionDay === null ? (
                <InboxIcon aria-hidden="true" className="size-5" />
              ) : (
                <>
                  <span aria-hidden="true">{formatWeekdayLetter(optionDay)}</span>
                  <span aria-hidden="true" className="font-mono text-sm tabular-nums">
                    {dayOfMonth(optionDay)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Screen readers hear the new day after each change */}
      <h2 aria-live="polite" className="sr-only">
        {slotName(slot)}
      </h2>

      {isEmpty && <p className="text-sm text-foreground-secondary">{emptyText}</p>}

      {sections.map((section) => (
        <AreaSection
          key={section.area.id}
          area={section.area}
          tasks={section.tasks}
          overdue={section.overdue}
          day={day}
          isToday={isToday}
          dayName={slotName(slot)}
          folded={folded.includes(section.area.id)}
          onToggle={() => toggleFold(section.area.id)}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}

type AreaSectionProps = {
  area: Area;
  tasks: Task[];
  overdue: Task[];
  day: string | null;
  isToday: boolean;
  dayName: string;
  folded: boolean;
  onToggle: () => void;
  onAddTask: (areaId: number) => void;
};

//=====JV-1 (U2.4.4): ONE AREA IN THE CHOSEN DAY: header that folds + its cell=====
function AreaSection({ area, tasks, overdue, day, isToday, dayName, folded, onToggle, onAddTask }: AreaSectionProps) {
  const bodyId = useId();
  const doneCount = tasks.filter((task) => task.completed).length;
  // "Sin fecha" has no progress: it's an inbox, not a day's plan
  const showProgress = day !== null && tasks.length > 0;
  const progressLabel = translateText(es.dashboard.phone.dayProgressLabel, { done: doneCount, total: tasks.length });
  const addLabel = translateText(es.dashboard.board.addTaskIn, { area: area.name });

  return (
    <section>
      <div className="flex items-center gap-1">
        {/* Disclosure pattern: a heading with a button inside, which says if it is open (aria-expanded) */}
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={!folded}
            aria-controls={bodyId}
            onClick={onToggle}
            className={`flex min-h-11 w-full items-center gap-2 rounded-control px-1 text-left text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-sunken ${FOCUS_RING}`}
          >
            <AreaDot color={area.color} />
            <span className="min-w-0 flex-1 truncate">{area.name}</span>
            {showProgress && (
              <>
                <span aria-hidden="true" className="font-mono text-xs font-normal tabular-nums text-foreground-secondary">
                  {doneCount}/{tasks.length}
                </span>
                <span className="sr-only">{progressLabel}</span>
              </>
            )}
            {/* ▾ open, ▸ folded */}
            <ChevronDownIcon
              aria-hidden="true"
              className={`size-4 shrink-0 text-foreground-secondary transition-transform duration-150 motion-reduce:transition-none ${folded ? "-rotate-90" : ""}`}
            />
          </button>
        </h3>
        <button
          type="button"
          onClick={() => onAddTask(area.id)}
          aria-label={addLabel}
          className={`flex size-11 shrink-0 items-center justify-center rounded-control text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground ${FOCUS_RING}`}
        >
          <PlusIcon aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div id={bodyId} hidden={folded}>
        {/* An area with nothing this day is only its header: the "+" is still there */}
        {(tasks.length > 0 || overdue.length > 0) && (
          <BoardCell
            tasks={tasks}
            overdueTasks={overdue}
            isToday={isToday}
            label={translateText(es.dashboard.board.cellLabel, { area: area.name, day: dayName })}
            foldDone={day === null}
          />
        )}
      </div>
    </section>
  );
}
