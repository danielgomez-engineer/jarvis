"use client";

import { useState } from "react";
import { es } from "@/lib/i18n/es";
import { AREA_NAME_MAX } from "@/lib/validations/limits";
import AreaDot from "./AreaDot";
import { Area } from "./types";

type AreaSelectorProps = {
  areas: Area[];
  // null = every area is visible
  selectedAreaId: number | null;
  onSelect: (areaId: number | null) => void;
  // Resolves true when the area was created, so the field can close
  onCreateArea: (name: string) => Promise<boolean>;
};

const CHIP = "flex shrink-0 items-center gap-2 border-b-2 px-1 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const CHIP_ACTIVE = "border-accent text-foreground";
const CHIP_INACTIVE = "border-transparent text-foreground-secondary hover:text-foreground";

//=====JV-1: AREA SELECTOR (works as a filter, ESTILOS §4.E)=====
export default function AreaSelector({ areas, selectedAreaId, onSelect, onCreateArea }: AreaSelectorProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const closeForm = () => {
    setAdding(false);
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const created = await onCreateArea(name);
    setSaving(false);

    if (created) closeForm();
  };

  return (
    <nav aria-label={es.dashboard.areas.selectorLabel} className="flex items-center gap-4 overflow-x-auto">
      <button
        type="button"
        aria-pressed={selectedAreaId === null}
        onClick={() => onSelect(null)}
        className={`${CHIP} ${selectedAreaId === null ? CHIP_ACTIVE : CHIP_INACTIVE}`}
      >
        {es.dashboard.areas.all}
      </button>

      {areas.map((area) => (
        <button
          key={area.id}
          type="button"
          aria-pressed={selectedAreaId === area.id}
          onClick={() => onSelect(area.id)}
          className={`${CHIP} ${selectedAreaId === area.id ? CHIP_ACTIVE : CHIP_INACTIVE}`}
        >
          <AreaDot color={area.color} />
          {area.name}
        </button>
      ))}

      {adding ? (
        <form onSubmit={handleSubmit} className="shrink-0">
          <label htmlFor="new-area-name" className="sr-only">
            {es.dashboard.areas.nameLabel}
          </label>
          <input
            id="new-area-name"
            autoFocus
            value={name}
            maxLength={AREA_NAME_MAX}
            disabled={saving}
            placeholder={es.dashboard.areas.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeForm()}
            onBlur={() => !name.trim() && closeForm()}
            className="w-40 rounded-control border border-line-strong bg-surface px-2 py-1 text-base sm:text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:bg-surface-sunken disabled:text-foreground-muted"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 rounded-control px-2 py-1 text-sm text-foreground-secondary transition-colors duration-150 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {es.dashboard.areas.add}
        </button>
      )}
    </nav>
  );
}
