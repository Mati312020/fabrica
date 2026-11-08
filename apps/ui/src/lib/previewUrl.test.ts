import { describe, expect, it } from "vitest";
import { safePreviewUrl } from "./previewUrl";

describe("safePreviewUrl", () => {
  it("acepta solo http://127.0.0.1:<puerto>", () => {
    expect(safePreviewUrl("http://127.0.0.1:5123/")).toBe("http://127.0.0.1:5123/");
    expect(safePreviewUrl("http://127.0.0.1:5123/ingresar?a=1")).toBe("http://127.0.0.1:5123/ingresar?a=1");
  });
  it.each([
    "",
    "no es url",
    "https://127.0.0.1:5123/",
    "http://localhost:5123/",
    "http://127.0.0.1/",
    "http://127.0.0.1.evil.com:5123/",
    "http://127.0.0.1:5123@evil.com/",
    "http://user:pw@127.0.0.1:5123/",
    "javascript:alert(1)",
    "file:///C:/x.html",
    "http://[::1]:5123/",
  ])("rechaza %s", (raw) => {
    expect(safePreviewUrl(raw)).toBeNull();
  });
});
