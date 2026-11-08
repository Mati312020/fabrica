import { describe, expect, it } from "vitest";
import { addMark, MAX_MARKS, pointToPercent, removeMark, toCommandMarks } from "./marks";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("marks", () => {
  it("convierte el clic a % del área", () => {
    expect(pointToPercent(300, 150, rect)).toEqual({ x: 50, y: 50 });
    expect(pointToPercent(101, 51, rect)).toEqual({ x: 0.3, y: 0.5 });
  });
  it("recorta lo que cae fuera del área y tolera área vacía", () => {
    expect(pointToPercent(0, 999, rect)).toEqual({ x: 0, y: 100 });
    expect(pointToPercent(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });
  it("no pasa del máximo del contrato y renumera al quitar", () => {
    let marks = Array.from({ length: MAX_MARKS }, () => ({ x: 1, y: 1, texto: "a" }));
    expect(addMark(marks, { x: 2, y: 2 })).toHaveLength(MAX_MARKS);
    marks = addMark([], { x: 1, y: 2 });
    marks = addMark(marks, { x: 3, y: 4 });
    expect(removeMark(marks, 0)).toEqual([{ x: 3, y: 4, texto: "" }]);
  });
  it("prepara el texto para el comando", () => {
    expect(toCommandMarks([{ x: 1, y: 2, texto: `  ${"x".repeat(1100)} ` }])[0]?.texto).toHaveLength(1000);
  });
});
