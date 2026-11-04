import { useSyncExternalStore } from "react";
import { PHONE_QUERY } from "@/lib/ui/media";

// JV-1: true below 640px, and it updates when the window is resized or the phone rotates

function subscribe(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(PHONE_QUERY).matches;
}

// Server render has no screen: it assumes desktop, and the browser corrects it right away
function getServerSnapshot() {
  return false;
}

export function useIsPhone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
