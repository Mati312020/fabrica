import { useReactFlow } from "@xyflow/react";
import { useEffect, type RefObject } from "react";

const PADDING = 0.06;
const MAX_ZOOM = 1;

/**
 * Encuadra el diagrama cuando cambia su forma o el tamaño del contenedor (sin zoom libre).
 * @param container Contenedor del lienzo.
 * @param shapeKey Cambia cuando se suman ramas o agentes.
 */
export function useAutoFit(container: RefObject<HTMLElement | null>, shapeKey: string): void {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const fit = () => void fitView({ padding: PADDING, maxZoom: MAX_ZOOM, duration: 0 });
    const frame = window.requestAnimationFrame(fit);
    const element = container.current;
    const observer = element ? new ResizeObserver(fit) : null;
    if (element) observer?.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [fitView, container, shapeKey]);
}
