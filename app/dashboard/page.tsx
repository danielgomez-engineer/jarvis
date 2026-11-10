"use client"; // Required because we use hooks (useState, useEffect, useRouter)

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { es } from "@/lib/i18n/es";
import { translateError, translateText } from "@/lib/i18n/traslate";
import { highlight } from "@/lib/i18n/highlight";
import { ApiResult, apiRequest } from "@/lib/api/request";
import { addDays, formatDayLabel, formatDayMonthLabel, sameWeekdayIn, startOfWeek, today, weekDays } from "@/lib/dates/week";
import { useIsPhone } from "@/lib/ui/useIsPhone";
import AreaSelector from "@/components/board/AreaSelector";
import { BoardProvider } from "@/components/board/BoardContext";
import BoardError from "@/components/board/BoardError";
import BoardGrid from "@/components/board/BoardGrid";
import BoardSkeleton from "@/components/board/BoardSkeleton";
import FirstAreaForm from "@/components/board/FirstAreaForm";
import NewTaskForm from "@/components/board/NewTaskForm";
import PhoneBoard, { DAY_SLOTS } from "@/components/board/PhoneBoard";
import WeekNav from "@/components/board/WeekNav";
import { useConfirm } from "@/components/ConfirmDialog";
import { Area, DaySlot, Task, TaskActions, TaskMove } from "@/components/board/types";
import { ErrorCode } from "@/lib/errors/codes";

type BoardStatus = "loading" | "ready" | "error";
type ApiFailure = Extract<ApiResult<unknown>, { ok: false }>;

// max-sm:min-h-11: 44px to tap on a phone (ESTILOS §3.3)
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:min-h-11";

// Errors stay longer than the global 4s so they can be read; undo needs time to be pressed (ESTILOS §4.J)
const ERROR_TOAST_MS = 7000;
const UNDO_TOAST_MS = 5000;
// Same id = Sonner replaces the toast: several requests failing with 401 at once show ONE "session expired"
const SESSION_TOAST_ID = "session-expired";

// Asks for the areas and that week's tasks at the same time. Doesn't touch the screen.
// "today" also brings the overdue tasks from older weeks (they show up in "Hoy").
async function fetchWeek(start: string) {
  const [areasResult, tasksResult] = await Promise.all([
    apiRequest<Area[]>("/api/areas"),
    apiRequest<Task[]>(`/api/tasks?weekStart=${start}&today=${today()}`),
  ]);
  return { areasResult, tasksResult };
}

// JV-1 (U2.4.4): the phone opens on today when the week has it, else on Monday (spec 2.2)
function defaultSlot(weekStart: string): DaySlot {
  const index = weekDays(weekStart).indexOf(today());
  return index >= 0 ? index : 0;
}

//=====JV-1: WEEKLY BOARD (replaces the old task list)=====
export default function DashboardPage() {
  const router = useRouter();
  const confirm = useConfirm();
  // JV-1 (U2.4.4): below 640px the board is one day at a time (PhoneBoard), not the grid
  const isPhone = useIsPhone();

  // null until the first load: "today" depends on the person's clock,
  // so it's read in the browser and never while the page is prerendered
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<BoardStatus>("loading");
  // Why the first load failed (shown in the error box)
  const [loadErrorCode, setLoadErrorCode] = useState<ErrorCode | undefined>(undefined);
  // Another week is on its way: the current board dims a little until it arrives
  const [weekLoading, setWeekLoading] = useState(false);
  // null = every area is visible
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  // Area picked with a lane's "+"; null = use the selected area or the first one
  const [newTaskAreaId, setNewTaskAreaId] = useState<number | null>(null);
  const [userName, setUserName] = useState(es.dashboard.user.nameLoading);
  const [loggingOut, setLoggingOut] = useState(false);
  // The column the phone shows. null = the default (today or Monday), so "Hoy" can go back to it
  const [phoneSlot, setPhoneSlot] = useState<DaySlot | null>(null);
  const daySlot = phoneSlot ?? (weekStart ? defaultSlot(weekStart) : 0);

  // Fast ‹ › clicks can answer out of order: only the latest request may update the screen
  const latestLoad = useRef(0);
  // The week asked for last, even if it hasn't arrived yet (so two quick clicks move two weeks)
  const requestedWeek = useRef<string | null>(null);
  // After the first good load, errors are toasts and the board stays on screen
  const hasLoaded = useRef(false);

  // Toast with the API error. A 401 anywhere (also in actions) = the session expired → login with a notice (spec 5)
  const showError = useCallback(
    (failure: ApiFailure) => {
      if (failure.status === 401) {
        toast.error(translateError(failure.code), { id: SESSION_TOAST_ID, duration: ERROR_TOAST_MS });
        router.push("/login");
        return;
      }

      toast.error(translateError(failure.code), { duration: ERROR_TOAST_MS });
    },
    [router],
  );

  //==========================LOAD A WEEK==============================================================
  // The screen is updated in .then(), when the answer arrives (React's pattern for fetching from an effect)
  const loadWeek = useCallback(
    (start: string) => {
      const loadId = ++latestLoad.current;
      requestedWeek.current = start;

      fetchWeek(start).then(({ areasResult, tasksResult }) => {
        if (loadId !== latestLoad.current) return;

        setWeekLoading(false);

        if (!areasResult.ok || !tasksResult.ok) {
          const failure = !areasResult.ok ? areasResult : (tasksResult as ApiFailure);
          requestedWeek.current = null;

          // First load failed (and it's not the session) → error box with "Reintentar".
          // A later week failed → toast, and the current week stays on screen.
          if (hasLoaded.current || failure.status === 401) {
            showError(failure);
          } else {
            setLoadErrorCode(failure.code);
            setStatus("error");
          }
          return;
        }

        // Week, areas and tasks change together, so the screen never mixes two weeks
        hasLoaded.current = true;
        setWeekStart(start);
        setAreas(areasResult.data);
        setTasks(tasksResult.data);
        setStatus("ready");
      });
    },
    [showError],
  );

  const loadUserName = useCallback(() => {
    apiRequest<{ name?: string | null }>("/api/auth/me").then((result) => {
      if (!result.ok) {
        showError(result);
        return;
      }

      setUserName(result.data.name || es.dashboard.user.nameFallback);
    });
  }, [showError]);

  useEffect(() => {
    loadWeek(startOfWeek(today()));
    loadUserName();
  }, [loadWeek, loadUserName]);

  // Called from clicks and keys (never from an effect), so it can mark the board as "loading another week"
  const goToWeek = useCallback(
    (start: string) => {
      setWeekLoading(true);
      loadWeek(start);
    },
    [loadWeek],
  );

  const moveWeeks = useCallback(
    (amount: number) => {
      const from = requestedWeek.current ?? weekStart;
      if (from) goToWeek(addDays(from, amount * 7));
    },
    [goToWeek, weekStart],
  );

  // "Hoy": the current week and, on the phone, today's column
  const backToToday = () => {
    setPhoneSlot(null);
    goToWeek(startOfWeek(today()));
  };

  // Phone: one step along the day strip. It stops at "Sin fecha" and Sunday (the week changes with ‹ ›)
  const moveDays = useCallback(
    (amount: number) => {
      const next = DAY_SLOTS[DAY_SLOTS.indexOf(daySlot) + amount];
      if (next !== undefined) setPhoneSlot(next);
    },
    [daySlot],
  );

  // Back to the skeleton while it tries again
  const retry = () => {
    setStatus("loading");
    loadWeek(startOfWeek(today()));
  };

  //==========================KEYBOARD (spec 5): N = new task, ←/→ = week (day on the phone)==============================================================
  useEffect(() => {
    if (status !== "ready") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Not while typing, nor inside the task menu (a popover) or a dialog: they handle their own keys
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable='true'], [popover], dialog");
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "n" || e.key === "N") {
        // preventDefault so the "n" isn't typed into the field that opens
        e.preventDefault();
        setNewTaskOpen(true);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const amount = e.key === "ArrowLeft" ? -1 : 1;
        if (isPhone) moveDays(amount);
        else moveWeeks(amount);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, isPhone, moveDays, moveWeeks]);

  //==========================CREATE AREA / TASK==============================================================
  // New tasks go to the lane whose "+" was pressed, else the selected area, else the first one (spec 2.3)
  const targetArea =
    areas.find((area) => area.id === newTaskAreaId) ?? areas.find((area) => area.id === selectedAreaId) ?? areas[0] ?? null;

  const openNewTaskIn = (areaId: number) => {
    setNewTaskAreaId(areaId);
    setNewTaskOpen(true);
  };

  // Picking a filter forgets the lane chosen with "+", so "Nueva tarea" follows the filter again
  const selectArea = (areaId: number | null) => {
    setSelectedAreaId(areaId);
    setNewTaskAreaId(null);
  };

  const closeNewTask = () => {
    setNewTaskOpen(false);
    setNewTaskAreaId(null);
  };

  const createArea = async (name: string): Promise<Area | null> => {
    const result = await apiRequest<Area>("/api/areas", { method: "POST", body: { name } });

    if (!result.ok) {
      showError(result);
      return null;
    }

    setAreas((current) => [...current, result.data]);
    toast.success(highlight(es.dashboard.areas.created, "name", result.data.name));
    return result.data;
  };

  const handleCreateArea = async (name: string): Promise<boolean> => (await createArea(name)) !== null;

  // JV-1 (U2.4.3): after the first area, the focus goes straight to its first task (spec 5)
  const handleCreateFirstArea = async (name: string): Promise<boolean> => {
    const area = await createArea(name);
    if (area) openNewTaskIn(area.id);
    return area !== null;
  };

  const handleCreateTask = async (title: string): Promise<boolean> => {
    if (!targetArea) return false;

    const result = await apiRequest<Task>("/api/tasks", { method: "POST", body: { title, areaId: targetArea.id } });

    if (!result.ok) {
      showError(result);
      return false;
    }

    setTasks((current) => [...current, result.data]);
    toast.success(highlight(es.dashboard.newTask.created, "area", targetArea.name));
    return true;
  };

  //==========================JV-1: EDIT A TASK (optimistic)==============================================================
  // The change shows at once; if the server says no, the task goes back to how it was and a toast explains why.
  // The screen never keeps showing something the server didn't save (spec 5).
  // `body` is what the API receives, when it isn't exactly `changes` (undoing a move also restores the position).
  const replaceTask = (next: Task) => setTasks((current) => current.map((item) => (item.id === next.id ? next : item)));

  // JV-1 (U2.5.2): a repeated task is shown the way GET shows it (placeInWeek): on its weekday inside the week
  // on screen. Needed because the server answers its FIRST day and its own (unused) `completed`, and because
  // a change can leave it outside this week (e.g. "Repetir" on an overdue task from an older week).
  // Its check stays as it was, unless it just moved or just started repeating (that day has no completion yet).
  const showInWeek = (shown: Task, before: Task, changes: Partial<Task>): Task => {
    if (!shown.repeatsWeekly || !shown.dueDate || !weekStart) return shown;

    const newDay = "dueDate" in changes || "repeatsWeekly" in changes;
    return {
      ...shown,
      dueDate: sameWeekdayIn(weekStart, shown.dueDate),
      completed: changes.completed ?? (newDay ? false : before.completed),
    };
  };

  const updateTask = async (task: Task, changes: Partial<Task>, body: object = changes): Promise<Task | null> => {
    replaceTask(showInWeek({ ...task, ...changes }, task, changes));

    const result = await apiRequest<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body });

    if (!result.ok) {
      replaceTask(task);
      showError(result);
      return null;
    }

    // The server's version: it may have changed more (e.g. the position in the new cell)
    const saved = showInWeek(result.data, task, changes);
    replaceTask(saved);
    return saved;
  };

  // JV-1 (U2.5.2): a repeated task is done one day at a time: the check stamps or removes that day's
  // completion (PUT/DELETE, U2.5.1) instead of touching `completed`. Optimistic, like any other change.
  const setRepeatDone = async (task: Task, completed: boolean): Promise<Task | null> => {
    const next = { ...task, completed };
    replaceTask(next);

    const result = await apiRequest(`/api/tasks/${task.id}/completions/${task.dueDate}`, { method: completed ? "PUT" : "DELETE" });

    if (!result.ok) {
      replaceTask(task);
      showError(result);
      return null;
    }

    return next;
  };

  //==========================JV-1 (U2.4.2): COMPLETE / UNDO==============================================================
  const setTaskCompleted = async (task: Task, completed: boolean, offerUndo: boolean) => {
    const updated = task.repeatsWeekly ? await setRepeatDone(task, completed) : await updateTask(task, { completed });
    if (!updated || !offerUndo) return;

    // Says what happened, with the task's name (ESTILOS §4.J)
    toast.success(highlight(completed ? es.dashboard.board.markedDone : es.dashboard.board.markedPending, "title", task.title), {
      duration: UNDO_TOAST_MS,
      action: { label: es.dashboard.board.undo, onClick: () => setTaskCompleted(updated, !completed, false) },
    });
  };

  const handleToggleCompleted = (task: Task) => setTaskCompleted(task, !task.completed, true);

  //==========================JV-1 (U2.6.1): MOVE ("Mover a…") / URGENT==============================================================
  // "Clase movida a mañana": hoy, mañana, a day of this week ("jue 5"), another week ("lun 9 nov"), Sin fecha or an area
  const describeMove = (move: TaskMove): string => {
    if (move.areaId !== undefined) return areas.find((area) => area.id === move.areaId)?.name ?? "";
    if (!move.dueDate) return es.dashboard.board.noDate;

    const now = today();
    if (move.dueDate === now) return es.dashboard.board.destinationToday;
    if (move.dueDate === addDays(now, 1)) return es.dashboard.board.destinationTomorrow;
    return startOfWeek(move.dueDate) === startOfWeek(now) ? formatDayLabel(move.dueDate) : formatDayMonthLabel(move.dueDate);
  };

  // A moved card is drawn again in its new cell, so the old "⋯" (which had the focus) disappears.
  // On the next frame, give the keyboard focus to the card in its new place (if it is still in this week).
  const focusTaskMenu = (taskId: number) =>
    requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      document.querySelector<HTMLElement>(`[data-task-trigger="${taskId}"]`)?.focus({ preventScroll: true });
    });

  const handleMoveTask = async (task: Task, move: TaskMove) => {
    const saving = updateTask(task, move);
    focusTaskMenu(task.id);

    const updated = await saving;
    if (!updated) return;

    // Undo = back to the same day, area and position it had
    const before = { dueDate: task.dueDate, areaId: task.areaId };

    toast.success(highlight(translateText(es.dashboard.board.moved, { destination: describeMove(move) }), "title", task.title), {
      duration: UNDO_TOAST_MS,
      action: {
        label: es.dashboard.board.undo,
        onClick: () => {
          // `completed` only for the screen: a repeated task goes back to a day that may already be done
          updateTask(updated, { ...before, completed: task.completed }, { ...before, position: task.position });
          focusTaskMenu(task.id);
        },
      },
    });
  };

  const handleToggleUrgent = async (task: Task) => {
    const urgent = !task.urgent;
    const updated = await updateTask(task, { urgent });
    if (!updated) return;

    toast.success(highlight(urgent ? es.dashboard.board.markedUrgent : es.dashboard.board.unmarkedUrgent, "title", task.title));
  };

  // JV-1 (U2.5.2): repeat every week on this task's weekday, or stop.
  // A repeated task's dueDate in the database is its first day, so stopping also sends the day and state
  // it shows now: it stays where it is instead of jumping back to its first week.
  const handleToggleRepeat = async (task: Task) => {
    const repeatsWeekly = !task.repeatsWeekly;
    const changes: Partial<Task> = repeatsWeekly
      ? { repeatsWeekly }
      : { repeatsWeekly, dueDate: task.dueDate, completed: task.completed };

    const updated = await updateTask(task, changes);
    if (!updated) return;

    toast.success(highlight(repeatsWeekly ? es.dashboard.board.markedRepeat : es.dashboard.board.unmarkedRepeat, "title", task.title));
  };

  //==========================JV-1 (C1): DELETE (asks first)==============================================================
  // Not optimistic: deleting can't be undone, so the card only disappears once the server confirms.
  const handleDeleteTask = async (task: Task) => {
    const confirmed = await confirm({
      // The name in red: it is what gets deleted (red = delete, ESTILOS §2.1)
      title: highlight(es.dashboard.board.deleteTitle, "title", task.title, "text-danger"),
      // JV-1 (U2.5.2): a repeated task is one row for every week: deleting it removes all of them and their history
      message: task.repeatsWeekly ? es.dashboard.board.deleteRepeatMessage : es.dashboard.board.deleteMessage,
      confirmLabel: es.dashboard.board.deleteConfirm,
    });
    if (!confirmed) return;

    const result = await apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });

    if (!result.ok) {
      showError(result);
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== task.id));
    toast.success(highlight(es.dashboard.board.deleted, "title", task.title));
  };

  const taskActions: TaskActions = {
    onToggleCompleted: handleToggleCompleted,
    onToggleUrgent: handleToggleUrgent,
    onToggleRepeat: handleToggleRepeat,
    onMove: handleMoveTask,
    onDelete: handleDeleteTask,
  };

  //==========================LOGOUT==============================================================
  const logout = async () => {
    setLoggingOut(true);
    const result = await apiRequest("/api/auth/logout", { method: "POST" });
    setLoggingOut(false);

    if (!result.ok) {
      showError(result);
      return;
    }

    toast.success(es.auth.logout.success);
    router.push("/login");
  };

  //============================================================================================================================
  const currentDay = today();
  const visibleAreas = selectedAreaId === null ? areas : areas.filter((area) => area.id === selectedAreaId);

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width bar + content inside (ESTILOS §5.2) */}
      <header className="border-b border-line bg-surface">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-8">
          <span className="text-base font-semibold text-foreground">{es.dashboard.board.brand}</span>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-foreground-secondary">{userName}</span>
            <button
              type="button"
              disabled={loggingOut}
              onClick={logout}
              className={`shrink-0 rounded-control px-2 py-1.5 text-sm text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
            >
              {loggingOut ? es.auth.logout.buttonLoading : es.auth.logout.button}
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-6 sm:px-8">
        <h1 className="sr-only">{es.dashboard.board.title}</h1>

        {/* JV-1 (U2.4.3): every state of the screen (spec 5) */}
        {status === "loading" && <BoardSkeleton />}

        {status === "error" && <BoardError code={loadErrorCode} onRetry={retry} />}

        {/* First time: one clear action instead of an empty board */}
        {status === "ready" && areas.length === 0 && <FirstAreaForm onCreate={handleCreateFirstArea} />}

        {status === "ready" && weekStart && areas.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <WeekNav
                weekStart={weekStart}
                isCurrentWeek={weekStart === startOfWeek(currentDay)}
                onPrevious={() => moveWeeks(-1)}
                onNext={() => moveWeeks(1)}
                onBackToToday={backToToday}
              />
              {/* key: changing the area remounts the field, so the focus jumps to it */}
              <NewTaskForm
                key={targetArea?.id}
                targetArea={targetArea}
                open={newTaskOpen}
                onOpen={() => setNewTaskOpen(true)}
                onClose={closeNewTask}
                onCreate={handleCreateTask}
              />
            </div>

            <AreaSelector areas={areas} selectedAreaId={selectedAreaId} onSelect={selectArea} onCreateArea={handleCreateArea} />

            {/* While another week loads, the current one dims (no layout jump) */}
            <div aria-busy={weekLoading} className={`transition-opacity duration-150 ${weekLoading ? "opacity-60" : ""}`}>
              {/* Every card reads the areas (for "Otra área"), today and the actions from here */}
              <BoardProvider value={{ areas, today: currentDay, taskActions }}>
                {/* Only one of the two is drawn: drawing both and hiding one with CSS would duplicate every card */}
                {isPhone ? (
                  <PhoneBoard
                    areas={visibleAreas}
                    tasks={tasks}
                    weekStart={weekStart}
                    today={currentDay}
                    slot={daySlot}
                    onSelectSlot={setPhoneSlot}
                    onAddTask={openNewTaskIn}
                  />
                ) : (
                  <BoardGrid areas={visibleAreas} tasks={tasks} weekStart={weekStart} today={currentDay} onAddTask={openNewTaskIn} />
                )}
              </BoardProvider>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
