"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { formatWeekRange } from "@/lib/dates/week";

type WeekNavProps = {
  weekStart: string;
  isCurrentWeek: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onBackToToday: () => void;
};

const ICON_BUTTON = "rounded-control p-1.5 text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

//=====JV-1: WEEK NAVIGATION ‹ 26 oct – 1 nov ›=====
export default function WeekNav({ weekStart, isCurrentWeek, onPrevious, onNext, onBackToToday }: WeekNavProps) {
  const range = formatWeekRange(weekStart);

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onPrevious} aria-label={es.dashboard.week.previous} className={ICON_BUTTON}>
        <ChevronLeftIcon className="size-5" />
      </button>

      {/* Dates go in mono (ESTILOS rule 5); aria-live reads the new week after each change */}
      <span aria-live="polite" className="min-w-32 text-center font-mono text-sm tabular-nums text-foreground">
        <span className="sr-only">{es.dashboard.week.srPrefix} </span>
        {range}
      </span>

      <button type="button" onClick={onNext} aria-label={es.dashboard.week.next} className={ICON_BUTTON}>
        <ChevronRightIcon className="size-5" />
      </button>

      {!isCurrentWeek && (
        <button
          type="button"
          onClick={onBackToToday}
          className="ml-1 rounded-control border border-line bg-surface px-2 py-1 text-sm text-foreground transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {es.dashboard.week.backToToday}
        </button>
      )}
    </div>
  );
}
