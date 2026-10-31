"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { es } from "@/lib/i18n/es";
import { translateText } from "@/lib/i18n/traslate";
import { TASK_TITLE_MAX } from "@/lib/validations/limits";
import CharCounter from "@/components/CharCounter";
import { Area } from "./types";

type NewTaskFormProps = {
  // Where the task goes: the selected area, or the first one when all are visible (spec 2.3)
  targetArea: Area | null;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  // Resolves true when the task was created, so the field can clear
  onCreate: (title: string) => Promise<boolean>;
};

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

//=====JV-1: QUICK CAPTURE: only the title, the task lands in "Sin fecha"=====
export default function NewTaskForm({ targetArea, open, onOpen, onClose, onCreate }: NewTaskFormProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setTitle("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const created = await onCreate(title);
    setSaving(false);

    // The field stays open, ready for the next task
    if (created) setTitle("");
  };

  if (!targetArea) {
    return <p className="text-sm text-foreground-secondary">{es.dashboard.newTask.needsArea}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex items-center gap-2 rounded-control bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent/90 ${FOCUS_RING}`}
      >
        <PlusIcon aria-hidden="true" className="size-4" />
        {es.dashboard.newTask.button}
        <kbd className="rounded-card bg-white/20 px-1 font-mono text-xs">{es.dashboard.newTask.shortcut}</kbd>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="new-task-title" className="sr-only">
        {es.dashboard.newTask.titleLabel}
      </label>
      <div className="relative">
        <input
          id="new-task-title"
          autoFocus
          value={title}
          maxLength={TASK_TITLE_MAX}
          disabled={saving}
          placeholder={translateText(es.dashboard.newTask.placeholder, { area: targetArea.name })}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && close()}
          className="w-64 rounded-control border border-line-strong bg-surface px-3 py-1.5 text-base sm:text-sm text-foreground focus:border-accent focus:outline-none disabled:bg-surface-sunken disabled:text-foreground-muted"
        />
        <span className="absolute -bottom-5 right-0 text-xs">
          <CharCounter length={title.length} max={TASK_TITLE_MAX} />
        </span>
      </div>
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className={`rounded-control bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
      >
        {saving ? es.dashboard.newTask.submitting : es.dashboard.newTask.submit}
      </button>
      <button
        type="button"
        onClick={close}
        className={`rounded-control px-2 py-1.5 text-sm text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken ${FOCUS_RING}`}
      >
        {es.dashboard.newTask.cancel}
      </button>
    </form>
  );
}
