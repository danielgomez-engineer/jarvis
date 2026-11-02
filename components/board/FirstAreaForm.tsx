"use client";

import { useRef, useState } from "react";
import { es } from "@/lib/i18n/es";
import { AREA_NAME_MAX } from "@/lib/validations/limits";

type FirstAreaFormProps = {
  // Resolves true when the area was created (the page then opens "Nueva tarea" in it)
  onCreate: (name: string) => Promise<boolean>;
};

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

//=====JV-1 (U2.4.3): FIRST TIME = ONE CLEAR ACTION, NEVER AN EMPTY BOARD (spec 5)=====
export default function FirstAreaForm({ onCreate }: FirstAreaFormProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // A suggestion fills the field instead of creating at once: "Proyecto personal" can still become "Jarvis"
  const pickSuggestion = (suggestion: string) => {
    setName(suggestion);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const created = await onCreate(name);
    setSaving(false);

    if (created) setName("");
  };

  return (
    <section aria-labelledby="first-area-title" className="max-w-md space-y-4 py-8">
      <div className="space-y-1">
        <h2 id="first-area-title" className="text-xl font-semibold text-foreground">
          {es.dashboard.firstArea.title}
        </h2>
        <p className="text-sm text-foreground-secondary">{es.dashboard.firstArea.hint}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          autoFocus
          aria-labelledby="first-area-title"
          value={name}
          maxLength={AREA_NAME_MAX}
          disabled={saving}
          placeholder={es.dashboard.firstArea.placeholder}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 py-2 text-base sm:text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:bg-surface-sunken disabled:text-foreground-muted"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className={`rounded-control bg-accent-strong px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
        >
          {saving ? es.dashboard.firstArea.submitting : es.dashboard.firstArea.submit}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-foreground-secondary">{es.dashboard.firstArea.suggestionsLabel}</p>
        <ul className="flex flex-wrap gap-2">
          {es.dashboard.firstArea.suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => pickSuggestion(suggestion)}
                className={`rounded-card border border-line bg-surface px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:border-line-strong ${FOCUS_RING}`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
