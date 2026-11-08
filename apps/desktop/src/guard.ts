import type { IpcMainInvokeEvent } from "electron";
import { isTrustedUrl } from "./trust";

/** Rechaza invocaciones que no vengan de la UI de Fabrica!. */
export function guard<A extends unknown[], R>(handler: (...args: A) => Promise<R>) {
  return (event: IpcMainInvokeEvent, ...args: A): Promise<R> => {
    if (!isTrustedUrl(event.senderFrame?.url)) throw new Error("Remitente no autorizado");
    return handler(...args);
  };
}
