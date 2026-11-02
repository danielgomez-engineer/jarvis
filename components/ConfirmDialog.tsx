"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { es } from "@/lib/i18n/es";

//=====JV-1 (C1): REUSABLE CONFIRMATION (ESTILOS §4.G)=====
// Any screen calls `const ok = await confirm({...})` and WAITS for yes/no,
// instead of each screen keeping its own "dialog open" state.

type ConfirmOptions = {
  // Says what is deleted: "¿Eliminar Clase de inglés?" (a node, so the name can be highlighted)
  title: React.ReactNode;
  // Says what happens after
  message: string;
  confirmLabel: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The promise's "resolve", called with the answer when the dialog closes
  const resolveRef = useRef<((answer: boolean) => void) | null>(null);
  // Where the focus was, to give it back on close
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (nextOptions) =>
      new Promise<boolean>((resolve) => {
        returnFocusRef.current = document.activeElement as HTMLElement | null;
        resolveRef.current = resolve;
        setOptions(nextOptions);
      }),
    [],
  );

  // showModal(): the page behind can't be used, Escape closes, and the focus stays inside.
  // The first focus goes to "Cancelar": a stray Enter must never delete (§4.G).
  useEffect(() => {
    if (!options) return;
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }, [options]);

  const close = (answer: boolean) => {
    dialogRef.current?.close();
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setOptions(null);
    returnFocusRef.current?.focus();
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        // Escape fires "cancel": answer "no" instead of letting the browser close it alone
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        // A click on the dark backdrop (outside the box) also means "no"
        onClick={(e) => {
          if (e.target === dialogRef.current) close(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-panel border border-line bg-surface p-0 text-foreground shadow-float backdrop:bg-black/30"
      >
        {options && (
          <div className="space-y-4 p-5">
            <div className="space-y-1">
              <h2 id="confirm-title" className="break-words text-base font-semibold">
                {options.title}
              </h2>
              <p id="confirm-message" className="text-sm text-foreground-secondary">
                {options.message}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-control border border-line bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {es.confirm.cancel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="rounded-control bg-danger px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-danger-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {options.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
