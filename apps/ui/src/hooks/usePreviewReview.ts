import { useCallback, useState } from "react";
import { addMark, MAX_MARKS, pointToPercent, removeMark, type AreaRect, type Mark } from "../lib/marks";

/** Anchos de la vista previa: escritorio (1280) y móvil (390). */
export const PREVIEW_WIDTHS = { desktop: 1280, mobile: 390 } as const;
export type PreviewWidth = keyof typeof PREVIEW_WIDTHS;

/** Estado de la revisión de un bloque visual: ancho, modo marcar, pines y comentario general. */
export function usePreviewReview() {
  const [width, setWidth] = useState<PreviewWidth>("desktop");
  const [marking, setMarking] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [comment, setComment] = useState("");

  const place = useCallback((x: number, y: number, rect: AreaRect) => {
    setMarks((m) => addMark(m, pointToPercent(x, y, rect)));
  }, []);
  const setText = useCallback((index: number, texto: string) => {
    setMarks((m) => m.map((mark, i) => (i === index ? { ...mark, texto } : mark)));
  }, []);
  const remove = useCallback((index: number) => setMarks((m) => removeMark(m, index)), []);

  return {
    width, setWidth, marking, setMarking, marks, comment, setComment, place, setText, remove,
    full: marks.length >= MAX_MARKS,
    canReject: comment.trim() !== "" || marks.length > 0,
  };
}
