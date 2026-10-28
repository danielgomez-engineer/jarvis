"use client"; //1. OBLIGATORIO PARA NEXT, ASI USAMOS LOS HOOKS (useState, useRouter)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { USER_EMAIL_MAX, USER_PASSWORD_MAX } from "@/lib/validations/limits";
import { translateError, translateFieldError } from "@/lib/i18n/traslate";
import { es } from "@/lib/i18n/es";
import { ApiErrorCode, FieldErrorCode } from "@/lib/errors/codes";
import FieldError from "@/components/FieldError";

export default function LoginPage() {
  // ESTADOS LOCALES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorCode>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Removes one field's error as soon as the person edits that field
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // MANEJADOR DE ENVIO
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      // peticion al endpoint que cree /app/api/auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: { code?: ApiErrorCode; fields?: Record<string, FieldErrorCode> };
      try {
        data = await res.json();
      } catch {
        setError(translateError("UNEXPECTED_RESPONSE"));
        return;
      }

      if (!res.ok) {
        // Format problems (empty field, malformed email) go under each input;
        // wrong credentials and server errors go in the form's error box
        if (data.fields && Object.keys(data.fields).length > 0) {
          setFieldErrors(data.fields);
        } else {
          setError(translateError(data.code));
        }
        return;
      }

      //EXITO como se uso httpOnly cookies, el navegador guardo  el token automaticamente
      //redirigir al dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(translateError("NETWORK_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="relative overflow-hidden w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 sm:p-9 shadow-xl shadow-cyan-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-600" />

        {/* 1. INSIGNIA SUPERIOR (IGUAL A LA DE BIENVENIDA) */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
            </span>
            {es.auth.login.badge}
          </span>
        </div>
        {/* 2. ENCABEZADO CON ACENTO DE COLOR */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            {es.auth.login.headingStart}{" "}
            <span className="text-cyan-600">{es.auth.login.headingAccent}</span>
          </h1>
          <p className="text-sm text-gray-500">{es.auth.login.subtitle}</p>
        </div>
        {/* MENSAJE DE ERROR */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600"
          >
            {error}
          </div>
        )}
        {/* FORMULARIO: noValidate turns off the browser's own bubbles so our Spanish messages show instead */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-700"
            >
              {es.common.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              placeholder={es.common.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              required
              maxLength={USER_EMAIL_MAX}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 ${fieldErrors.email ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20"}`}
            />
            <FieldError
              id="email-error"
              message={translateFieldError(fieldErrors.email, { max: USER_EMAIL_MAX })}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-700"
            >
              {es.common.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              placeholder={es.common.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                const value = e.target.value;

                if (
                  new TextEncoder().encode(value).length <= USER_PASSWORD_MAX
                ) {
                  setPassword(value);
                  clearFieldError("password");
                }
              }}
              required
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 ${fieldErrors.password ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20"}`}
            />
            <FieldError
              id="password-error"
              message={translateFieldError(fieldErrors.password, { max: USER_PASSWORD_MAX })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-cyan-600 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? es.auth.login.submitting : es.auth.login.submit}
          </button>
        </form>
        {/* ENLACE AL REGISTRO */}
        <div className="text-center text-sm text-gray-500 pt-1">
          {es.auth.login.noAccountQuestion}{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-600 hover:text-cyan-500 hover:underline"
          >
            {es.auth.login.registerLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
