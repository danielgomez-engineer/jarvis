"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  // ESTADOS LOCALES
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // BOTON DE ENVIO LOGICA
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Peticion al endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error al realizar registro");
        return;
      }

      //CAPturar mensaje de exito del backend
      toast.success(data.message || "¡Cuenta creada exitosamente!");

      // esperar 1 segundos  para que el usuario vea el mensaje y luego sea redirigido al login
      setTimeout(() => {
      // EXITO: Redirigir al login
        router.push("/login");
      }, 1000);

    } catch (err) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="relative overflow-hidden w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 sm:p-9 shadow-xl shadow-cyan-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600" />

        {/* 1. INSIGNIA SUPERIOR (ADN JARVIS) */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
            </span>
            Nueva Cuenta • Jarvis
          </span>
        </div>

        {/* 2. ENCABEZADO CON ACENTO DE COLOR */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Crear <span className="text-cyan-600">Cuenta</span>
          </h1>
          <p className="text-sm text-gray-500">
            Completa tus datos para acceder a tu centro de mando
          </p>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-gray-700"
            >
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              placeholder="Daniel..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-700"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="micorreo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-cyan-600 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>
        </form>

        {/* ENLACE AL LOGIN */}
        <div className="text-center text-sm text-gray-500 pt-1">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-600 hover:text-cyan-500 hover:underline"
          >
            Inicia Sesión
          </Link>
        </div>

      </div>
    </div>
  );
}