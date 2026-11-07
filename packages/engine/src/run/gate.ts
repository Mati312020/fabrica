/** Puerta de despacho: bloquea mientras haya pausa o el presupuesto lo impida. */
export interface Gate {
  /**
   * Espera hasta que se pueda despachar.
   * @param onWait Se llama una vez si hubo que esperar.
   * @param onResume Se llama al retomar.
   */
  wait(onWait?: () => void, onResume?: () => void): Promise<void>;
  /** Reevalúa la condición y despierta a los que esperan. */
  poke(): void;
}

/**
 * Crea la puerta.
 * @param isBlocked Condición de bloqueo.
 */
export function createGate(isBlocked: () => boolean): Gate {
  let waiters: Array<() => void> = [];
  return {
    async wait(onWait, onResume) {
      if (!isBlocked()) return;
      onWait?.();
      while (isBlocked()) await new Promise<void>((resolve) => waiters.push(resolve));
      onResume?.();
    },
    poke() {
      const pending = waiters;
      waiters = [];
      for (const resolve of pending) resolve();
    },
  };
}

/** Pool de N espacios; `acquire` devuelve el índice del espacio tomado. */
export interface Pool {
  acquire(): Promise<number>;
  release(slot: number): void;
}

/**
 * Crea un pool de espacios numerados.
 * @param size Cantidad de espacios.
 */
export function createPool(size: number): Pool {
  const free = Array.from({ length: size }, (_, i) => i);
  const queue: Array<(slot: number) => void> = [];
  return {
    acquire: () => {
      const slot = free.shift();
      return slot !== undefined ? Promise.resolve(slot) : new Promise((resolve) => queue.push(resolve));
    },
    release(slot) {
      const next = queue.shift();
      if (next) next(slot);
      else free.push(slot);
    },
  };
}
