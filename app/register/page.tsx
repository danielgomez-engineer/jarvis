"use client";
import {
  USER_EMAIL_MAX,
  USER_NAME_MAX,
  USER_PASSWORD_MAX,
  USER_PASSWORD_MIN,
} from "@/lib/validations/limits";
import Link from "next/link";
import CharCounter from "@/components/CharCounter";
import FieldError from "@/components/FieldError";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { translateError, translateFieldError } from "@/lib/i18n/traslate";
import { es } from "@/lib/i18n/es";
import { ApiErrorCode, FieldErrorCode } from "@/lib/errors/codes";

export default function RegisterPage() {
  // ESTADOS LOCALES
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorCode>>({});
  // General form error (not tied to one field), shown in a box inside the card
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

  // BOTON DE ENVIO LOGICA
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      // Peticion al endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      let data: { code?: ApiErrorCode; fields?: Record<string, FieldErrorCode> };
      try {
        data = await res.json();
      } catch {
        setError(translateError("UNEXPECTED_RESPONSE"));
        return;
      }

      if (!res.ok) {
        // Field problems go under each input; anything else goes in the form's error box
        if (data.fields && Object.keys(data.fields).length > 0) {
          setFieldErrors(data.fields);
        } else {
          setError(translateError(data.code));
        }
        return;
      }

      //CAPturar mensaje de exito del backend
      toast.success(es.auth.register.success);

      // esperar 1 segundos  para que el usuario vea el mensaje y luego sea redirigido al login
      setTimeout(() => {
        // EXITO: Redirigir al login
        router.push("/login");
      }, 1000);
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

        {/* 1. INSIGNIA SUPERIOR (ADN JARVIS) */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
            </span>
            {es.auth.register.badge}
          </span>
        </div>

        {/* 2. ENCABEZADO CON ACENTO DE COLOR */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            {es.auth.register.headingStart} <span className="text-cyan-600">{es.auth.register.headingAccent}</span>
          </h1>
          <p className="text-sm text-gray-500">
            {es.auth.register.subtitle}
          </p>
        </div>

        {/* MENSAJE DE ERROR GENERAL (role="alert" lo anuncia en lectores de pantalla) */}
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
              htmlFor="name"
              className="flex items-center justify-between text-xs font-medium text-gray-700"
            >
              <span>{es.auth.register.nameLabel}</span>
              {<CharCounter length={name.length} max={USER_NAME_MAX} />}
            </label>
            <input
              id="name"
              type="text"
              placeholder={es.auth.register.namePlaceholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              required
              maxLength={USER_NAME_MAX}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 ${fieldErrors.name ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20"}`}
            />
            <FieldError
              id="name-error"
              message={translateFieldError(fieldErrors.name, { max: USER_NAME_MAX })}
            />
          </div>

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
              maxLength={USER_PASSWORD_MAX}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:bg-white focus:outline-none focus:ring-2 ${fieldErrors.password ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20"}`}
            />
            <FieldError
              id="password-error"
              message={translateFieldError(fieldErrors.password, {
                min: USER_PASSWORD_MIN,
                max: USER_PASSWORD_MAX,
              })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-cyan-600 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? es.auth.register.submitting : es.auth.register.submit}
          </button>
        </form>

        {/* ENLACE AL LOGIN */}
        <div className="text-center text-sm text-gray-500 pt-1">
          {es.auth.register.hasAccountQuestion}{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-600 hover:text-cyan-500 hover:underline"
          >
            {es.auth.register.loginLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
