"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  ExclamationCircleIcon,
  InboxIcon,
  SunIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { addDays } from "@/lib/dates/week";
import { PHONE_QUERY } from "@/lib/ui/media";
import AreaDot from "./AreaDot";
import { useBoard } from "./BoardContext";
import { Task } from "./types";

// What the card can ask the menu to do (the "m" shortcut opens it)
export type TaskMenuHandle = { open: () => void };

type TaskMenuProps = {
  task: Task;
  ref?: React.Ref<TaskMenuHandle>;
};

type View = "main" | "pickDay" | "pickArea";

// w-56 below; used to keep the menu inside the screen
const MENU_WIDTH = 224;
const GAP = 4;
const EDGE = 8;
// If there is less room than this below the button, it opens upwards (when above has more room)
const PREFERRED_HEIGHT = 340;

const ITEM =
  "flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent max-sm:min-h-11";
const SECTION_LABEL = "px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-foreground-secondary";
const SEPARATOR = "my-1 border-t border-line";

// Desktop: next to the "⋯" button, below it or above if it doesn't fit, never off-screen.
// Phone: no coordinates; the classes turn it into a bottom sheet.
function placeMenu(menu: HTMLElement, trigger: HTMLElement) {
  if (window.matchMedia(PHONE_QUERY).matches) {
    menu.style.cssText = "";
    return;
  }

  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
  const spaceAbove = rect.top - GAP - EDGE;
  const openBelow = spaceBelow >= PREFERRED_HEIGHT || spaceBelow >= spaceAbove;
  const left = Math.min(Math.max(EDGE, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - EDGE);

  Object.assign(menu.style, {
    left: `${left}px`,
    right: "auto",
    top: openBelow ? `${rect.bottom + GAP}px` : "auto",
    bottom: openBelow ? "auto" : `${window.innerHeight - rect.top + GAP}px`,
    maxHeight: `${openBelow ? spaceBelow : spaceAbove}px`,
  });
}

//=====JV-1 (U2.6.1): TASK MENU "⋯" — MOVE, URGENT, DELETE (ESTILOS §4.F)=====
// Native popover: it renders on top of everything (the board's sideways scroll can't cut it),
// and Escape or a click outside close it without extra code.
export default function TaskMenu({ task, ref }: TaskMenuProps) {
  const { areas, today, taskActions } = useBoard();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  const [pickedDay, setPickedDay] = useState("");
  const menuId = useId();
  const dayInputId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({ open: () => menuRef.current?.showPopover() }), []);

  // Every time the menu opens or changes view, the focus goes to its first option (keyboard users start there)
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("button, input")?.focus();
  }, [open, view]);

  // While open on desktop, follow the button if the page or the board scrolls
  useEffect(() => {
    if (!open) return;

    const follow = () => {
      if (menuRef.current && triggerRef.current) placeMenu(menuRef.current, triggerRef.current);
    };

    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open]);

  const close = () => {
    if (menuRef.current?.matches(":popover-open")) menuRef.current.hidePopover();
  };

  // Close first and give the focus back to "⋯", then act: the card may move to another cell,
  // and the confirmation dialog needs to know where the focus has to return
  const closeAndRun = (action: () => void) => {
    close();
    triggerRef.current?.focus({ preventScroll: true });
    action();
  };

  // ↑/↓ move between options, and Tab stays inside while the menu is open
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const inDateField = (e.target as HTMLElement).tagName === "INPUT";

    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !inDateField) {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (e.key === "Tab" && items.length > 0) {
      const last = items.length - 1;
      if (!e.shiftKey && index === last) {
        e.preventDefault();
        items[0].focus();
      } else if (e.shiftKey && index <= 0) {
        e.preventDefault();
        items[last].focus();
      }
    }
  };

  const tomorrow = addDays(today, 1);
  const otherAreas = areas.filter((area) => area.id !== task.areaId);

  const openPickDay = () => {
    setPickedDay(task.dueDate ?? today);
    setView("pickDay");
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-expanded={open}
        aria-label={translateText(es.dashboard.board.menuButton, { title: task.title })}
        title={es.dashboard.board.menuHint}
        // The page looks for it after a move, to give the keyboard focus back to the card
        data-task-trigger={task.id}
        className="-m-1 shrink-0 rounded-control p-1 text-foreground-secondary transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-expanded:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="size-4" />
      </button>

      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="dialog"
        aria-label={translateText(es.dashboard.board.menuLabel, { title: task.title })}
        onBeforeToggle={(e) => {
          if (e.newState === "open" && menuRef.current && triggerRef.current) placeMenu(menuRef.current, triggerRef.current);
        }}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) return;

          setView("main");
          // Closed with Escape or a click on nothing focusable: the focus goes back to "⋯"
          const active = document.activeElement;
          if (!active || active === document.body || menuRef.current?.contains(active)) {
            triggerRef.current?.focus({ preventScroll: true });
          }
        }}
        onKeyDown={handleKeyDown}
        className="fixed m-0 w-56 overflow-y-auto rounded-control border border-line bg-surface p-1 text-foreground shadow-float transition-[opacity,translate,display,overlay] duration-200 transition-discrete starting:opacity-0 motion-reduce:transition-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[80vh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-panel max-sm:border-x-0 max-sm:border-b-0 max-sm:p-2 max-sm:pb-[max(0.5rem,env(safe-area-inset-bottom))] max-sm:starting:translate-y-4 max-sm:backdrop:bg-black/30"
      >
        {view === "main" && (
          <>
            {/* The task itself on top: with the note, which the card doesn't show (only its mark) */}
            <div className="border-b border-line px-3 pb-2 pt-1">
              <p className="break-words text-sm font-medium text-foreground">{task.title}</p>
              {task.description && (
                <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-line break-words text-xs text-foreground-secondary">
                  {task.description}
                </p>
              )}
            </div>

            <p className={SECTION_LABEL}>{es.dashboard.board.moveTo}</p>
            {/* Options that would change nothing are hidden (e.g. "Hoy" for a task that is already today) */}
            {task.dueDate !== today && (
              <button type="button" className={ITEM} onClick={() => closeAndRun(() => taskActions.onMove(task, { dueDate: today }))}>
                <SunIcon aria-hidden="true" className="size-4 shrink-0" />
                {es.dashboard.board.moveToday}
              </button>
            )}
            {task.dueDate !== tomorrow && (
              <button type="button" className={ITEM} onClick={() => closeAndRun(() => taskActions.onMove(task, { dueDate: tomorrow }))}>
                <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0" />
                {es.dashboard.board.moveTomorrow}
              </button>
            )}
            <button type="button" className={ITEM} onClick={openPickDay}>
              <CalendarDaysIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="flex-1">{es.dashboard.board.movePickDay}</span>
              <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-foreground-secondary" />
            </button>
            {task.dueDate !== null && (
              <button type="button" className={ITEM} onClick={() => closeAndRun(() => taskActions.onMove(task, { dueDate: null }))}>
                <InboxIcon aria-hidden="true" className="size-4 shrink-0" />
                {es.dashboard.board.moveNoDate}
              </button>
            )}
            {otherAreas.length > 0 && (
              <button type="button" className={ITEM} onClick={() => setView("pickArea")}>
                <TagIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{es.dashboard.board.moveOtherArea}</span>
                <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-foreground-secondary" />
              </button>
            )}

            <div role="separator" className={SEPARATOR} />
            <button type="button" className={ITEM} onClick={() => closeAndRun(() => taskActions.onToggleUrgent(task))}>
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              {task.urgent ? es.dashboard.board.unmarkUrgent : es.dashboard.board.markUrgent}
            </button>

            <div role="separator" className={SEPARATOR} />
            {/* Red = delete (ESTILOS §2.1). It still asks before deleting (C1). */}
            <button type="button" className={`${ITEM} text-danger`} onClick={() => closeAndRun(() => taskActions.onDelete(task))}>
              <TrashIcon aria-hidden="true" className="size-4 shrink-0" />
              {es.dashboard.board.deleteAction}
            </button>

            {/* Phone bottom sheet: a clear way out at the end (ESTILOS §4.F) */}
            <button type="button" className={`${ITEM} mt-1 justify-center font-medium sm:hidden`} onClick={close}>
              {es.dashboard.board.closeMenu}
            </button>
          </>
        )}

        {view === "pickDay" && (
          <form
            className="space-y-3 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pickedDay) closeAndRun(() => taskActions.onMove(task, { dueDate: pickedDay }));
            }}
          >
            <p className="text-sm font-medium text-foreground">{es.dashboard.board.pickDayTitle}</p>
            <div className="space-y-1">
              <label htmlFor={dayInputId} className="text-xs text-foreground-secondary">
                {es.dashboard.board.pickDayLabel}
              </label>
              {/* The native date field already gives "YYYY-MM-DD", the same day format as the API */}
              <input
                id={dayInputId}
                type="date"
                required
                value={pickedDay}
                onChange={(e) => setPickedDay(e.target.value)}
                className="w-full rounded-control border border-line-strong bg-surface px-2 py-1.5 font-mono text-base tabular-nums text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setView("main")}
                className="rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:min-h-11"
              >
                {es.dashboard.board.back}
              </button>
              <button
                type="submit"
                disabled={!pickedDay || pickedDay === task.dueDate}
                className="rounded-control bg-accent-strong px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:min-h-11"
              >
                {es.dashboard.board.pickDaySubmit}
              </button>
            </div>
          </form>
        )}

        {view === "pickArea" && (
          <>
            <p className={SECTION_LABEL}>{es.dashboard.board.pickAreaTitle}</p>
            {otherAreas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={ITEM}
                onClick={() => closeAndRun(() => taskActions.onMove(task, { areaId: area.id }))}
              >
                <AreaDot color={area.color} />
                <span className="min-w-0 flex-1 truncate">{area.name}</span>
              </button>
            ))}
            <div role="separator" className={SEPARATOR} />
            <button type="button" className={`${ITEM} text-foreground-secondary`} onClick={() => setView("main")}>
              {es.dashboard.board.back}
            </button>
          </>
        )}
      </div>
    </>
  );
}
