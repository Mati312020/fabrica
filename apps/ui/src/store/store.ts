import type { FabricaEvent } from "@fabrica/events";
import { create } from "zustand";
import type { ConnectionStatus } from "../lib/engineClient";
import { applyEvent } from "./applyEvent";
import { initialState, type DomainState } from "./state";

interface FabricaStore {
  domain: DomainState;
  connection: ConnectionStatus;
  /** Único camino para cambiar el estado de dominio. */
  dispatchEvent(event: FabricaEvent): void;
  setConnection(status: ConnectionStatus): void;
}

/** Store global: el dominio solo se alimenta con eventos del motor. */
export const useFabricaStore = create<FabricaStore>((set) => ({
  domain: initialState,
  connection: "conectando",
  dispatchEvent: (event) => set((s) => ({ domain: applyEvent(s.domain, event) })),
  setConnection: (connection) => set({ connection }),
}));
