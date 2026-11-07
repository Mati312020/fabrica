import type { AlfaEvent } from "@alfa/events";
import { create } from "zustand";
import type { ConnectionStatus } from "../lib/engineClient";
import { applyEvent } from "./applyEvent";
import { initialState, type DomainState } from "./state";

interface AlfaStore {
  domain: DomainState;
  connection: ConnectionStatus;
  /** Único camino para cambiar el estado de dominio. */
  dispatchEvent(event: AlfaEvent): void;
  setConnection(status: ConnectionStatus): void;
}

/** Store global: el dominio solo se alimenta con eventos del motor. */
export const useAlfaStore = create<AlfaStore>((set) => ({
  domain: initialState,
  connection: "conectando",
  dispatchEvent: (event) => set((s) => ({ domain: applyEvent(s.domain, event) })),
  setConnection: (connection) => set({ connection }),
}));
