import { describe, expect, it } from "vitest";
import { browserChannel } from "./channel.js";

describe("browserChannel", () => {
  it("usa Edge en Windows por defecto", () => {
    expect(browserChannel({}, "win32")).toBe("msedge");
  });
  it("usa el Chromium de Playwright en Linux por defecto", () => {
    expect(browserChannel({}, "linux")).toBeUndefined();
  });
  it("respeta FABRICA_BROWSER_CHANNEL", () => {
    expect(browserChannel({ FABRICA_BROWSER_CHANNEL: "chrome" }, "linux")).toBe("chrome");
    expect(browserChannel({ FABRICA_BROWSER_CHANNEL: "chromium" }, "win32")).toBeUndefined();
  });
});
