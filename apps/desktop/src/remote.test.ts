import { describe, expect, it } from "vitest";
import { configError, isValidEngineToken, parseRemoteUrl } from "./remote";

const TOKEN = "k".repeat(32);

describe("motor remoto: validación", () => {
  it("acepta wss:// y ws://127.0.0.1; rechaza el resto", () => {
    expect(parseRemoteUrl("wss://motor.example.com/ws")).toBe("wss://motor.example.com/ws");
    expect(parseRemoteUrl("ws://127.0.0.1:4317")).toBe("ws://127.0.0.1:4317/");
    for (const bad of ["ws://motor.example.com", "https://motor.example.com", "wss://u:p@motor.example.com", "wss://m.example.com/?t=1", "wss://m.example.com/#x", "motor", 5]) {
      expect(parseRemoteUrl(bad)).toBeNull();
    }
  });

  it("el token necesita 32 bytes y no puede tener espacios", () => {
    expect(isValidEngineToken(TOKEN)).toBe(true);
    expect(isValidEngineToken("corto")).toBe(false);
    expect(isValidEngineToken(`${TOKEN} x`)).toBe(false);
    expect(isValidEngineToken("k".repeat(300))).toBe(false);
  });

  it("configError: local siempre sirve; remoto pide URL y token (o uno ya guardado)", () => {
    expect(configError({ mode: "local" }, false)).toBeNull();
    expect(configError({ mode: "remote", url: "ws://x.com", token: TOKEN }, false)).toBe("invalid_url");
    expect(configError({ mode: "remote", url: "wss://x.com" }, false)).toBe("token_required");
    expect(configError({ mode: "remote", url: "wss://x.com" }, true)).toBeNull();
    expect(configError({ mode: "remote", url: "wss://x.com", token: "corto" }, true)).toBe("invalid_token");
  });
});
