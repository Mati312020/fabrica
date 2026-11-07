import type { ReactNode } from "react";

/** Props de {@link Panel}. */
interface PanelProps {
  /** Nombre accesible del panel. */
  label: string;
  className?: string;
  children: ReactNode;
}

/** Panel de vidrio del tablero. */
export function Panel({ label, className = "", children }: PanelProps) {
  return (
    <section aria-label={label} className={`glass flex min-h-0 min-w-0 flex-col ${className}`}>
      {children}
    </section>
  );
}

/** Props de {@link PanelHeader}. */
interface PanelHeaderProps {
  title: string;
  /** Dato a la derecha (conteo, estado). */
  aside?: string;
}

/** Encabezado de panel: etiqueta en mayúsculas y un dato opcional. */
export function PanelHeader({ title, aside }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="lbl text-tx2!">{title}</span>
      {aside ? <span className="mono truncate text-[10.5px] text-tx3">{aside}</span> : null}
    </div>
  );
}

/** Props de {@link EmptyState}. */
interface EmptyStateProps {
  children: ReactNode;
}

/** Estado vacío: dice qué va a aparecer ahí, sin datos de ejemplo. */
export function EmptyState({ children }: EmptyStateProps) {
  return (
    <p className="m-auto max-w-[34ch] text-center font-mono text-[12px] leading-relaxed text-tx3">
      {children}
    </p>
  );
}
