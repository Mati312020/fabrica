/** Marca sobre la vista previa; `x` e `y` en % del área (0-100). */
export interface Mark {
  x: number;
  y: number;
  texto: string;
}

/** Ancho de la vista previa tal como lo nombra el contrato. */
export type Ancho = "escritorio" | "movil";

/**
 * Traduce el ancho de la UI al del contrato.
 * @param width Ancho elegido en la vista previa.
 */
export const toAncho = (width: "desktop" | "mobile"): Ancho => (width === "mobile" ? "movil" : "escritorio");

/** Máximo de marcas que acepta el contrato. */
export const MAX_MARKS = 30;

/** Rectángulo del área marcable, en píxeles de pantalla. */
export interface AreaRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Convierte un clic en coordenadas porcentuales dentro del área, recortadas a 0-100.
 * @param clientX Posición X del clic.
 * @param clientY Posición Y del clic.
 * @param rect Rectángulo del área.
 */
export function pointToPercent(clientX: number, clientY: number, rect: AreaRect): Pick<Mark, "x" | "y"> {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: round1(clamp(((clientX - rect.left) / rect.width) * 100)),
    y: round1(clamp(((clientY - rect.top) / rect.height) * 100)),
  };
}

/**
 * Agrega una marca sin pasarse del máximo del contrato.
 * @param marks Marcas actuales.
 * @param point Posición de la nueva marca.
 */
export function addMark(marks: Mark[], point: Pick<Mark, "x" | "y">): Mark[] {
  return marks.length >= MAX_MARKS ? marks : [...marks, { ...point, texto: "" }];
}

/**
 * Quita la marca `index`; los pines se renumeran solos porque el número es la posición.
 * @param marks Marcas actuales.
 * @param index Posición a quitar.
 */
export function removeMark(marks: Mark[], index: number): Mark[] {
  return marks.filter((_, i) => i !== index);
}

/**
 * Marcas listas para `block.reject`: texto recortado y a lo sumo 1000 caracteres.
 * @param marks Marcas del borrador.
 */
export function toCommandMarks(marks: Mark[]): Mark[] {
  return marks.map((m) => ({ ...m, texto: m.texto.trim().slice(0, 1000) }));
}
