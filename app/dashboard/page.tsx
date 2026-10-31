"use client"; // Required because we use hooks (useState, useEffect, useRouter)

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { es } from "@/lib/i18n/es";
import { translateError, translateText } from "@/lib/i18n/traslate";
import { ApiResult, apiRequest } from "@/lib/api/request";
import { addDays, startOfWeek, today } from "@/lib/dates/week";
import AreaSelector from "@/components/board/AreaSelector";
import BoardGrid from "@/components/board/BoardGrid";
import NewTaskForm from "@/components/board/NewTaskForm";
import WeekNav from "@/components/board/WeekNav";
import { Area, Task } from "@/components/board/types";

type BoardStatus = "loading" | "ready" | "error";
type ApiFailure = Extract<ApiResult<unknown>, { ok: false }>;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Asks for the areas and that week's tasks at the same time. Doesn't touch the screen.
async function fetchWeek(start: string) {
  const [areasResult, tasksResult] = await Promise.all([
    apiRequest<Area[]>("/api/areas"),
    apiRequest<Task[]>(`/api/tasks?weekStart=${start}`),
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

  // Toast with the API error; a 401 anywhere means the session expired → login
  const showError = useCallback(
    (failure: ApiFailure) => {
      toast.error(translateError(failure.code));
      if (failure.status === 401) router.push("/login");
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

        if (!areasResult.ok || !tasksResult.ok) {
          showError(!areasResult.ok ? areasResult : (tasksResult as ApiFailure));
          requestedWeek.current = null;
          // First load failed → error screen. A later week failed → keep showing the current one.
          setStatus((current) => (current === "ready" ? current : "error"));
          return;
        }

        // Week, areas and tasks change together, so the screen never mixes two weeks
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

  const moveWeeks = useCallback(
    (amount: number) => {
      const from = requestedWeek.current ?? weekStart;
      if (from) loadWeek(addDays(from, amount * 7));
    },
    [loadWeek, weekStart],
  );

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

  const closeNewTask = () => {
    setNewTaskOpen(false);
    setNewTaskAreaId(null);
  };

  const handleCreateArea = async (name: string): Promise<boolean> => {
    const result = await apiRequest<Area>("/api/areas", { method: "POST", body: { name } });

    if (!result.ok) {
      showError(result);
      return false;
    }

    setAreas((current) => [...current, result.data]);
    toast.success(translateText(es.dashboard.areas.created, { name: result.data.name }));
    return true;
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

        {/* Skeletons, first-time screen and the full error state arrive in U2.4.3 */}
        {status === "loading" && (
          <p role="status" className="text-sm text-foreground-secondary">
            {es.dashboard.board.loading}
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="flex items-center gap-3 text-sm text-foreground">
            <p>{es.dashboard.board.loadError}</p>
            <button
              type="button"
              onClick={retry}
              className={`rounded-control border border-line bg-surface px-3 py-1.5 font-medium transition-colors duration-150 hover:border-line-strong ${FOCUS_RING}`}
            >
              {es.dashboard.board.retry}
            </button>
          </div>
        )}

        {status === "ready" && weekStart && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <WeekNav
                weekStart={weekStart}
                isCurrentWeek={weekStart === startOfWeek(currentDay)}
                onPrevious={() => moveWeeks(-1)}
                onNext={() => moveWeeks(1)}
                onBackToToday={() => loadWeek(startOfWeek(today()))}
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

            <AreaSelector areas={areas} selectedAreaId={selectedAreaId} onSelect={setSelectedAreaId} onCreateArea={handleCreateArea} />

            {areas.length === 0 ? (
              <p className="text-sm text-foreground-secondary">{es.dashboard.board.noAreas}</p>
            ) : (
              <BoardGrid areas={visibleAreas} tasks={tasks} weekStart={weekStart} today={currentDay} onAddTask={openNewTaskIn} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
