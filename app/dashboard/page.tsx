"use client"; // Required because we use hooks (useState, useEffect, useRouter)

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { es } from "@/lib/i18n/es";
import { translateError, translateText } from "@/lib/i18n/traslate";
import { ApiResult, apiRequest } from "@/lib/api/request";
import { addDays, startOfWeek, today } from "@/lib/dates/week";
import AreaSelector from "@/components/board/AreaSelector";
import BoardError from "@/components/board/BoardError";
import BoardGrid from "@/components/board/BoardGrid";
import BoardSkeleton from "@/components/board/BoardSkeleton";
import FirstAreaForm from "@/components/board/FirstAreaForm";
import NewTaskForm from "@/components/board/NewTaskForm";
import WeekNav from "@/components/board/WeekNav";
import { Area, Task } from "@/components/board/types";
import { ErrorCode } from "@/lib/errors/codes";

type BoardStatus = "loading" | "ready" | "error";
type ApiFailure = Extract<ApiResult<unknown>, { ok: false }>;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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

//=====JV-1: WEEKLY BOARD (replaces the old task list)=====
export default function DashboardPage() {
  const router = useRouter();

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

  // Back to the skeleton while it tries again
  const retry = () => {
    setStatus("loading");
    loadWeek(startOfWeek(today()));
  };

  //==========================KEYBOARD (spec 5): N = new task, ←/→ = week==============================================================
  useEffect(() => {
    if (status !== "ready") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']");
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "n" || e.key === "N") {
        // preventDefault so the "n" isn't typed into the field that opens
        e.preventDefault();
        setNewTaskOpen(true);
      } else if (e.key === "ArrowLeft") {
        moveWeeks(-1);
      } else if (e.key === "ArrowRight") {
        moveWeeks(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, moveWeeks]);

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
    toast.success(translateText(es.dashboard.areas.created, { name: result.data.name }));
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
    toast.success(translateText(es.dashboard.newTask.created, { area: targetArea.name }));
    return true;
  };

  //==========================JV-1 (U2.4.2): COMPLETE / UNDO==============================================================
  // Optimistic: the check changes at once, and if the server says no, it goes back and a toast explains why.
  // The screen never keeps showing something the server didn't save (spec 5).
  const setTaskCompleted = async (task: Task, completed: boolean, offerUndo: boolean) => {
    const applyCompleted = (value: boolean) =>
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed: value } : item)));

    applyCompleted(completed);

    const result = await apiRequest<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: { completed } });

    if (!result.ok) {
      applyCompleted(!completed);
      showError(result);
      return;
    }

    if (!offerUndo) return;

    // Says what happened, with the task's name (ESTILOS §4.J)
    toast.success(translateText(completed ? es.dashboard.board.markedDone : es.dashboard.board.markedPending, { title: task.title }), {
      duration: UNDO_TOAST_MS,
      action: { label: es.dashboard.board.undo, onClick: () => setTaskCompleted(task, !completed, false) },
    });
  };

  const handleToggleCompleted = (task: Task) => setTaskCompleted(task, !task.completed, true);

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
                onBackToToday={() => goToWeek(startOfWeek(today()))}
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
              <BoardGrid
                areas={visibleAreas}
                tasks={tasks}
                weekStart={weekStart}
                today={currentDay}
                onAddTask={openNewTaskIn}
                onToggleCompleted={handleToggleCompleted}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
