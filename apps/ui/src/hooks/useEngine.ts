import { useCallback, useEffect, useRef } from "react";
import { resolveConnection } from "../lib/connectionInfo";
import { createEngineClient, type EngineClient } from "../lib/engineClient";
import { useAlfaStore } from "../store/store";

/** Función para mandar comandos al motor. */
export type SendCommand = EngineClient["send"];

/**
 * Conecta con el motor mientras el componente esté montado y alimenta el store con sus eventos.
 * @returns `send` para mandar comandos (false si no hay conexión).
 */
export function useEngine(): { send: SendCommand } {
  const client = useRef<EngineClient | null>(null);

  useEffect(() => {
    const { dispatchEvent, setConnection } = useAlfaStore.getState();
    const active = createEngineClient({
      resolve: resolveConnection,
      onEvent: dispatchEvent,
      onStatus: setConnection,
    });
    client.current = active;
    const unsubscribe = window.alfa?.onEngineExit(() => {
      active.stop();
      setConnection("desconectado");
    });
    return () => {
      active.stop();
      unsubscribe?.();
      client.current = null;
    };
  }, []);

  const send = useCallback<SendCommand>(
    (type, data) => client.current?.send(type, data) ?? false,
    [],
  );
  return { send };
}
