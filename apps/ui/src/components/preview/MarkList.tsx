import { useTranslation } from "react-i18next";
import type { Mark } from "../../lib/marks";

/** Props de {@link MarkList}. */
interface MarkListProps {
  marks: Mark[];
  onText(index: number, texto: string): void;
  onRemove(index: number): void;
}

/** Lista numerada de marcas: cada pin lleva su comentario editable. */
export function MarkList({ marks, onText, onRemove }: MarkListProps) {
  const { t } = useTranslation();
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {marks.map((m, i) => (
        <li key={i} className="pmk">
          <b>{i + 1}</b>
          <input
            value={m.texto}
            maxLength={1000}
            onChange={(e) => onText(i, e.target.value)}
            aria-label={t("preview.markText", { n: i + 1 })}
            placeholder={t("preview.markText", { n: i + 1 })}
            className="h-7 min-w-0 flex-1 rounded-md border border-line bg-transparent px-2 text-[12.5px] text-tx placeholder:text-tx3"
          />
          <button type="button" className="btn" aria-label={t("preview.removeMark", { n: i + 1 })} onClick={() => onRemove(i)}>×</button>
        </li>
      ))}
    </ol>
  );
}
