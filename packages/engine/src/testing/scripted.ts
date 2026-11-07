import type { ModelProvider, ProviderEvent, RoleName, RoleRequest } from "../provider/types.js";

/** Respuesta de un guion: una salida (con herramientas y texto opcionales) o un error. */
export type Reply =
  | { output: unknown; costUsd?: number; tools?: string[]; text?: string }
  | { error: { code: string; message: string } };

/** Guion de un rol: recibe el pedido y el número de llamada de ese rol (desde 1). */
export type Handler = (req: RoleRequest, call: number) => Reply | Promise<Reply>;

/**
 * Proveedor de pruebas: responde según guiones por rol. SOLO para tests; ningún código
 * de la app lo importa y el build del motor no lo incluye.
 */
export class ScriptedProvider implements ModelProvider {
  /** Todos los pedidos recibidos, en orden. */
  readonly calls: RoleRequest[] = [];
  /** Máximo de llamadas simultáneas por rol. */
  readonly maxActive: Partial<Record<RoleName, number>> = {};
  private readonly counts: Partial<Record<RoleName, number>> = {};
  private readonly active: Partial<Record<RoleName, number>> = {};

  constructor(private readonly handlers: Partial<Record<RoleName, Handler>>) {}

  /** Cantidad de llamadas de un rol. */
  count(role: RoleName): number {
    return this.counts[role] ?? 0;
  }

  async *run(req: RoleRequest): AsyncGenerator<ProviderEvent> {
    this.calls.push(req);
    const call = (this.counts[req.role] = this.count(req.role) + 1);
    const now = (this.active[req.role] = (this.active[req.role] ?? 0) + 1);
    this.maxActive[req.role] = Math.max(this.maxActive[req.role] ?? 0, now);
    try {
      const handler = this.handlers[req.role];
      const reply = handler ? await handler(req, call) : { error: { code: "no_script", message: req.role } };
      if ("error" in reply) return yield { kind: "error", ...reply.error };
      for (const name of reply.tools ?? []) yield { kind: "tool", name, detail: "x" };
      if (reply.text) yield { kind: "text", delta: reply.text };
      yield { kind: "result", output: reply.output, costUsd: reply.costUsd ?? 0.01, inputTokens: 100, outputTokens: 50 };
    } finally {
      this.active[req.role] = (this.active[req.role] ?? 1) - 1;
    }
  }
}
