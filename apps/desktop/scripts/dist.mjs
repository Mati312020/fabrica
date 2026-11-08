// Compila la UI y el desktop y arma el instalador NSIS en <raíz>/release/.
import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const builder = process.platform === "win32" ? "electron-builder.cmd" : "electron-builder";
const root = new URL("../../../", import.meta.url);
const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(npm, ["run", "build"], root);
run(builder, ["--win", "nsis", "--x64"], new URL("../", import.meta.url));
