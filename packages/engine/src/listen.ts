import { createServer as createHttp, type Server } from "node:http";
import { createServer as createHttps } from "node:https";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";

/** Certificado y clave PEM para servir `wss://` directamente desde el motor. */
export interface TlsOptions {
  cert: string | Buffer;
  key: string | Buffer;
}

/** Opciones de red del WebSocket. */
export interface ListenOptions {
  host: string;
  port: number;
  tls?: TlsOptions | undefined;
  maxPayload: number;
  verifyOrigin(origin: string | undefined): boolean;
}

/** Servidor WebSocket ya escuchando. */
export interface Listener {
  wss: WebSocketServer;
  port: number;
  close(): Promise<void>;
}

/**
 * Abre el servidor HTTP(S) y le cuelga el WebSocket. Con `tls` es `wss://`; sin él, `ws://`.
 * @param options Host, puerto, TLS opcional, tamaño máximo de mensaje y verificación de Origin.
 */
export async function listen(options: ListenOptions): Promise<Listener> {
  const http: Server = options.tls ? createHttps(options.tls) : createHttp();
  http.on("request", (_req, res) => {
    res.writeHead(426, { "Content-Type": "text/plain" }).end("Fabrica! engine: WebSocket only");
  });
  const wss = new WebSocketServer({
    server: http,
    maxPayload: options.maxPayload,
    verifyClient: ({ origin }: { origin?: string }) => options.verifyOrigin(origin),
  });
  await new Promise<void>((resolve, reject) => {
    http.once("error", reject);
    http.listen(options.port, options.host, resolve);
  });
  return {
    wss,
    port: (http.address() as AddressInfo).port,
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of wss.clients) client.terminate();
        wss.close(() => http.close(() => resolve()));
        http.closeAllConnections();
      }),
  };
}
