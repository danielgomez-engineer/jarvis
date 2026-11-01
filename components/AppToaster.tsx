"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

//=====JV-1: APP TOASTS (ESTILOS §4.J)=====
// Neutral surface, color only on the icon. "!" beats Sonner's own styles.
// On a phone they go at the bottom, near the thumb; on desktop at the top (to be reviewed in U2.7).

const PHONE_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function AppToaster() {
  // Server render has no screen: it assumes desktop, and the browser corrects it right away
  const isPhone = useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches, () => false);

  return (
    <Toaster
      position={isPhone ? "bottom-center" : "top-center"}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "bg-surface! border-line! text-foreground! shadow-float! rounded-panel! font-sans!",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
          actionButton:
            "bg-surface-sunken! text-foreground! font-medium! rounded-control! hover:bg-line! transition-colors duration-150",
        },
      }}
    />
  );
}
