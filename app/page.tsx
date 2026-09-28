import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="relative overflow-hidden w-full max-w-lg space-y-8 rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 shadow-xl shadow-cyan-500/10 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600" />

        {/* INSIGNIA SUPERIOR */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
            </span>
            Jarvis v1.0 • Sistema Activo
          </span>
        </div>

        {/* TÍTULO Y DESCRIPCIÓN */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Bienvenido a <span className="text-cyan-600">Jarvis</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto leading-relaxed">
            Tu centro de mando inteligente para organizar, priorizar y completar tareas con máxima eficiencia.
          </p>
        </div>

        {/* ACCIONES (BOTONES) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-cyan-600 active:scale-[0.99]"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50/40 hover:text-cyan-700 active:scale-[0.99]"
          >
            Crear Cuenta
          </Link>
        </div>

      </div>
    </main>
  );
}