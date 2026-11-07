import { useEffect, useRef, useState } from "react";
import { stepDelay } from "../lib/countUp";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Cifra que sube de a uno hacia el valor recibido (sin saltos). Con movimiento reducido salta directo.
 * @param target Valor final, o null si no hay dato.
 */
export function useCountUp(target: number | null): number | null {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(target ?? 0);
  const current = useRef(shown);

  useEffect(() => {
    if (target === null || reduced) return;
    let timer = 0;
    const tick = () => {
      if (current.current === target) return;
      current.current += Math.sign(target - current.current);
      setShown(current.current);
      timer = window.setTimeout(tick, stepDelay(target - current.current));
    };
    timer = window.setTimeout(tick, stepDelay(target - current.current));
    return () => window.clearTimeout(timer);
  }, [target, reduced]);

  if (target === null) return null;
  return reduced ? target : shown;
}
