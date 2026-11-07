import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * El preámbulo de React Refresh es un script inline que la CSP de producción bloquea.
 * Solo en dev se habilita `script-src 'unsafe-inline'`; el build conserva la CSP estricta.
 */
const relaxCspInDev: Plugin = {
  name: "fabrica-relax-csp-dev",
  apply: "serve",
  transformIndexHtml: (html) =>
    html.replace("default-src 'self';", "default-src 'self'; script-src 'self' 'unsafe-inline';"),
};

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), relaxCspInDev],
  server: { host: "localhost", port: 5173, strictPort: true },
});
