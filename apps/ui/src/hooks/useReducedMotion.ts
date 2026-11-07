import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
}

/** Verdadero si la persona pidió movimiento reducido. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
