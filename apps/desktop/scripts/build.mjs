import { build } from "esbuild";

const common = { bundle: true, platform: "node", format: "cjs", target: "node22", logLevel: "info" };

// El preload y el main usan el módulo `electron` que provee el runtime.
await build({ ...common, entryPoints: ["src/main.ts"], outfile: "dist/main.cjs", external: ["electron"] });
await build({ ...common, entryPoints: ["src/preload.ts"], outfile: "dist/preload.cjs", external: ["electron"] });

// El motor se empaqueta completo (ws, zod, events); las dependencias nativas de ws son opcionales.
await build({
  ...common,
  entryPoints: ["../../packages/engine/src/child.ts"],
  outfile: "dist/engine.cjs",
  // El SDK de Claude se carga con import() en runtime: lleva su propio binario nativo y no se empaqueta.
  external: ["bufferutil", "utf-8-validate", "@anthropic-ai/claude-agent-sdk"],
});
