import type { EngineConnection } from "@fabrica/events";

const LOCAL_WS = /^ws:\/\/127\.0\.0\.1:\d{1,5}$/;

/**
 * Obtiene `{url, token}` del puente de Electron o, solo en desarrollo, de `?ws=&token=`.
 * Valida que la URL sea el WebSocket local: la query es input no confiable.
 */
export async function resolveConnection(): Promise<EngineConnection | null> {
  if (window.fabrica) return window.fabrica.engine.getConnection();
  if (!import.meta.env.DEV) return null;
  const query = new URLSearchParams(window.location.search);
  const url = query.get("ws");
  const token = query.get("token");
  if (!url || !token || !LOCAL_WS.test(url)) return null;
  return { url, token };
}
