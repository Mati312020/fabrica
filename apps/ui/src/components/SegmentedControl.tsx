/** Opción de un control segmentado. */
export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Props de {@link SegmentedControl}. */
interface SegmentedControlProps<T extends string> {
  /** Nombre accesible del grupo. */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange(value: T): void;
}

/** Grupo de botones excluyentes (tema, idioma) con el estilo `.seg` del diseño. */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex overflow-hidden rounded-md border border-line">
      {options.map((option) => {
        const selected = option.value === value;
        const tone = selected ? "bg-tx/10 text-tx" : "text-tx3";
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`h-7 cursor-pointer border-0 bg-transparent px-2.5 font-mono text-[11px] ${tone}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
