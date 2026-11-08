import { describe, expect, it } from "vitest";
import { ev, fold } from "./fixtures";

const plan = ev("plan.ready", { planId: "p1", bloques: [{ id: "b1", nombre: "login", tipo: "visual", dependeDe: [], familia: "ui" }] });

describe("eventos de la Fase 4", () => {
  it("block.committed guarda el hash en el bloque y queda en el registro", () => {
    const s = fold([plan, ev("block.assembled", { blockId: "b1" }, 1), ev("block.committed", { blockId: "b1", hash: "abc1234def" }, 2)]);
    expect(s.blocks.b1?.hash).toBe("abc1234def");
    expect(s.log.at(-1)?.type).toBe("block.committed");
  });
  it("engine.status trae commitPerBlock y gitRepo", () => {
    const s = fold([ev("engine.status", { apiKeyConfigured: true, paused: false, workspace: "C:/p", budgetLimit: 5, commitPerBlock: true, gitRepo: true })]);
    expect(s.commitPerBlock).toBe(true);
    expect(s.gitRepo).toBe(true);
  });
  it("engine.error queda por código, el último gana", () => {
    const s = fold([ev("engine.error", { code: "no_browser", message: "a" }), ev("engine.error", { code: "git_failed", message: "g" }, 1), ev("engine.error", { code: "no_browser", message: "b" }, 2)]);
    expect(s.notices.no_browser?.message).toBe("b");
    expect(s.notices.git_failed?.message).toBe("g");
    expect(s.notices.no_browser!.seq).toBeGreaterThan(s.notices.git_failed!.seq);
  });
  it("audit.browserReport queda por tarea", () => {
    const s = fold([ev("audit.browserReport", { taskId: "t1", errores: ["x"], fallidos: [], pasosFallidos: ["click #a"], capturas: ["C:/p/.fabrica/capturas/1.png"] })]);
    expect(s.browserReports.t1).toMatchObject({ errores: ["x"], pasosFallidos: ["click #a"] });
  });
  it("block.approvalRequested guarda la URL real de la vista previa", () => {
    const s = fold([plan, ev("block.approvalRequested", { blockId: "b1", previewUrl: "http://127.0.0.1:4000/", archivos: ["index.html"] }, 1)]);
    expect(s.blocks.b1?.previewUrl).toBe("http://127.0.0.1:4000/");
  });
});
