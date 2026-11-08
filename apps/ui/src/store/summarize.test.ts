import type { FabricaEvent } from "@fabrica/events";
import { describe, expect, it } from "vitest";
import { summarize } from "./summarize";

describe("summarize", () => {
  it("redondea los montos a dos decimales", () => {
    const event = { type: "budget.update", at: "2026-11-08T12:00:00.000Z", data: { usado: 2.9499999999, limite: 5 } };
    expect(summarize(event as FabricaEvent)).toBe("usado=2.95 limite=5");
  });
});
