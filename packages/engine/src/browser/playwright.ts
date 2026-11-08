import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Browser, BrowserContext } from "playwright-core";
import { browserChannel } from "./channel.js";
import { describeStep, runStep } from "./steps.js";
import {
  DEFAULT_WIDTHS, NoBrowserError, RUN_TIMEOUT_MS, STEP_TIMEOUT_MS,
  type BrowserReport, type BrowserRequest, type BrowserRunner,
} from "./types.js";

const MAX_ENTRIES = 20;
const LAUNCH_TIMEOUT_MS = 30_000;
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

async function launch(): Promise<Browser> {
  try {
    const { chromium } = await import("playwright-core");
    const channel = browserChannel();
    return await chromium.launch({ ...(channel ? { channel } : {}), headless: true, timeout: LAUNCH_TIMEOUT_MS });
  } catch (error) {
    throw new NoBrowserError(error instanceof Error ? error.message.split("\n")[0] ?? "sin navegador" : "sin navegador");
  }
}

const push = (list: string[], text: string) => {
  if (list.length < MAX_ENTRIES && !list.includes(text)) list.push(text);
};

/** Un ancho: abre un contexto aislado, recorre los pasos, junta evidencia y lo cierra siempre. */
async function runWidth(browser: Browser, req: BrowserRequest, width: number, report: BrowserReport): Promise<void> {
  const context: BrowserContext = await browser.newContext({ viewport: { width, height: 800 }, serviceWorkers: "block" });
  const tag = `[${width}px]`;
  try {
    const origin = new URL(req.baseUrl);
    // Solo se permite la vista previa entre los servicios locales: el sitio generado no toca otros puertos.
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return LOOPBACK.has(url.hostname) && url.origin !== origin.origin ? route.abort() : route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(req.stepTimeoutMs ?? STEP_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(req.stepTimeoutMs ?? STEP_TIMEOUT_MS);
    page.on("console", (m) => m.type() === "error" && push(report.errores, `${tag} ${m.text().slice(0, 300)}`));
    page.on("pageerror", (e) => push(report.errores, `${tag} excepción: ${e.message.slice(0, 300)}`));
    page.on("requestfailed", (r) => push(report.fallidos, `${tag} ${r.url()} · ${r.failure()?.errorText ?? "falló"}`));
    page.on("response", (r) => r.status() >= 400 && push(report.fallidos, `${tag} ${r.status()} ${r.url()}`));
    const deadline = Date.now() + RUN_TIMEOUT_MS;
    const first = req.recorrido[0];
    if (first?.accion !== "ir") await page.goto(req.baseUrl, { waitUntil: "load" }).catch(() => undefined);
    for (const [i, step] of req.recorrido.entries()) {
      const label = describeStep(step, i, req.recorrido.length);
      req.onStep?.(`${label} (${width}px)`);
      if (Date.now() > deadline) {
        report.pasosFallidos.push(`${tag} ${label}: tiempo agotado (${RUN_TIMEOUT_MS / 1000} s por recorrido)`);
        continue;
      }
      await runStep(page, step, req.baseUrl).catch((e: unknown) => {
        report.pasosFallidos.push(`${tag} ${label}: ${(e instanceof Error ? e.message : String(e)).split("\n")[0]}`);
      });
      const shot = path.join(req.outDir, `${req.prefix}-${width}-paso${i + 1}.png`);
      if (await page.screenshot({ path: shot }).then(() => true, () => false)) report.capturas.push(shot);
    }
  } finally {
    await context.close().catch(() => undefined);
  }
}

/**
 * Runner real: Edge instalado en Windows vía `playwright-core` (`channel: "msedge"`), sin descargar
 * navegadores. El navegador se cierra siempre. El recorrido es determinista: ningún paso lo decide un LLM.
 */
export const playwrightRunner: BrowserRunner = {
  async run(req) {
    await mkdir(req.outDir, { recursive: true });
    const report: BrowserReport = { errores: [], fallidos: [], pasosFallidos: [], capturas: [] };
    const browser = await launch();
    try {
      for (const width of req.widths ?? DEFAULT_WIDTHS) await runWidth(browser, req, width, report);
    } finally {
      await browser.close().catch(() => undefined);
    }
    return report;
  },
};
