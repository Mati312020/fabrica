// Genera build/icon.ico (y icon.png) desde build/icon.svg. Uso: npm run icon -w @fabrica/desktop
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const dir = new URL("../build/", import.meta.url);
const svg = readFileSync(new URL("icon.svg", dir));
const png = (size) => new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();

const images = SIZES.map((size) => ({ size, data: png(size) }));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // tipo: icono
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, data }) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // ancho (0 = 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // alto
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por píxel
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += data.length;
  return e;
});
writeFileSync(new URL("icon.ico", dir), Buffer.concat([header, ...entries, ...images.map((i) => i.data)]));
writeFileSync(new URL("icon.png", dir), png(256));
console.log(`icon.ico: ${images.length} tamaños (${SIZES.join(", ")})`);
