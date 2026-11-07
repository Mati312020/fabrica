import { create } from "zustand";

interface UiStore {
  /** Tarjetas ya resueltas por la persona (clave de {@link cardKey}). */
  decided: Record<string, true>;
  /** Agente (o `memoria`) abierto en el panel de detalle. */
  selected: string | null;
  /** La persona ya pidió usar la reserva del presupuesto. */
  reserveAsked: boolean;
  decide(key: string): void;
  select(id: string | null): void;
  askReserve(): void;
}

/** Estado de interfaz que no viene del motor: qué tarjeta se resolvió y qué panel está abierto. */
export const useUi = create<UiStore>((set) => ({
  decided: {},
  selected: null,
  reserveAsked: false,
  decide: (key) => set((s) => ({ decided: { ...s.decided, [key]: true } })),
  select: (selected) => set({ selected }),
  askReserve: () => set({ reserveAsked: true }),
}));

/** Claves de tarjetas pendientes; incluyen el evento que las originó para poder repetirse. */
export const cardKey = {
  plan: (planId: string) => `plan:${planId}`,
  block: (blockId: string, seq: number) => `block:${blockId}#${seq}`,
  blocked: (taskId: string, seq: number) => `blocked:${taskId}#${seq}`,
};
