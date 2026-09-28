"use client"; // Required because we use hooks (useState, useEffect, useRouter)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrashIcon } from "@heroicons/react/24/outline";

// Shape of a task, matching what Prisma/the backend returns.
// This gives type safety and autocomplete to "tasks" below.
type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  // Starts as an empty array (not undefined) so .map() never breaks,
  // even before the server response arrives.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // header user name
  const [userName, setUserName] = useState("Cargando");

  const router = useRouter();

  // Declared at component level (not inside useEffect) so both the
  // initial load AND handleCreateTask can call it to refresh the list.
  const fetchTasks = async () => {
    try {
      // No body, no manual auth header: the httpOnly "token" cookie
      // is sent automatically by the browser on same-origin requests.
      const res = await fetch("/api/tasks", {
        method: "GET",
      });

      // If the session isn't valid, send the user back to login
      // instead of showing them an empty dashboard.
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error loading your tasks");
        return;
      }

      setTasks(data);
    } catch (err) {
      toast.error("Error connecting to the server");
    } finally {
      setLoading(false);
    }
  };

  // useEffect with an empty dependency array [] runs exactly ONCE,
  // right after this component mounts — i.e. "when the page loads, do this".
  useEffect(() => {
    fetchTasks();
    fetchUserName();
  }, [router]);

  //=================================================POST TASK======================================================================
  // Create task handler — separate "creating" loading state from the
  // initial page "loading" state, so submitting the form doesn't flash
  // the "Cargando tareas..." message over the whole list.
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error al crear tarea");
        return;
      }

      toast.success(data.message || "Tarea creada correctamente");

      // Reset the form for the next task
      setTitle("");
      setDescription("");

      // Refresh the list so the new task shows up without a page reload
      await fetchTasks();
    } catch (err) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setCreating(false);
    }
  };

  //===============================UPDATE COMPLETED TASK========================================================================================

  //update "completed" task handler
  const handleUpdateCompletedTask = async (id: number, completed: boolean) => {
    setError("");
    setUpdating(true);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error al cambiar estado");
        return;
      }

      toast.success(data.message);
      await fetchTasks();
    } catch (err) {
      toast.error("Error de conexion con el servidor");
    } finally {
      setUpdating(false);
    }
  };

  //===============================DELETE TASK========================================================================================
  const handleDeleteTask = async (id: number) => {
    setError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      await fetchTasks();
    } catch (err) {
      toast.error("Error de conexion con el servidor");
    } finally {
      setDeleting(false);
    }
  };
  //==========================USER NAME==============================================================
  const fetchUserName = async () => {
    setError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setUserName(data.name || "Usuario");
    } catch (err) {
      toast.error("Error connecting to the server");
    }
  };
  //==========================LOGOUT==============================================================
  const logout = async () => {
    setError("");
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      if (res.status === 200) {
        router.push("/login");
      }
    } catch (err) {
      toast.error("Error Logout ");
    } finally {
      setLoggingOut(false);
    }
  };
  //============================================================================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="border-b border-b-gray-200 bg-white px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h2 className="inline-flex items-center rounded-full border border-cyan-200/60 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            {userName}
          </h2>
          <button
            className="cursor-pointer rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            type="button"
            disabled={loggingOut}
            onClick={() => logout()}
          >
            {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 mt-4 sm:mt-6">
        {/* INSIGNIA + TÍTULO: grupo con espacio interno reducido, van juntos */}
        <div className="space-y-3">
          {/* INSIGNIA SUPERIOR (ADN Jarvis) */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
              </span>
              Centro de Mando • Tareas
            </span>
          </div>

          {/* TÍTULO Y SUBTÍTULO */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Panel de <span className="text-cyan-600">Tareas</span>
            </h1>
            <p className="text-sm text-gray-500">
              Gestiona y supervisa tus objetivos diarios
            </p>
          </div>
        </div>

        {/* TARJETA DE CREACIÓN RÁPIDA */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xl shadow-cyan-500/10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600" />

          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Nueva tarea
          </h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="title"
                className="block text-xs font-medium text-gray-700"
              >
                Título
              </label>
              <input
                id="title"
                type="text"
                placeholder="Tarea..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-gray-700"
              >
                Descripción
              </label>
              <input
                id="description"
                type="text"
                placeholder="Esta tarea la voy a hacer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="cursor-pointer w-full sm:w-auto rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-cyan-600 active:scale-[0.99] disabled:opacity-50"
            >
              {creating ? "Creando..." : "Agregar Tarea"}
            </button>
          </form>
        </div>

        {/* LISTA DE TAREAS */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Mis tareas</h2>

          {loading && (
            <p className="text-sm text-gray-500">Cargando tareas...</p>
          )}

          {!loading && tasks.length === 0 && (
            <p className="text-sm text-gray-500">No tienes tareas todavía.</p>
          )}

          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-sm font-medium text-gray-900 ${task.completed ? "line-through opacity-60" : ""}`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {task.completed ? (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          handleUpdateCompletedTask(task.id, !task.completed)
                        }
                        className="cursor-pointer inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        Completada
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() =>
                          handleUpdateCompletedTask(task.id, !task.completed)
                        }
                        className="cursor-pointer inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        Pendiente
                      </button>
                    )}

                    <button
                      className="cursor-pointer size-5 text-red-600"
                      disabled={deleting}
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-gray-500">
                    {task.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
