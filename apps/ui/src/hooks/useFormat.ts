import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** Formateadores de números según el idioma activo. */
export function useFormat() {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const money = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD" });
    const int = new Intl.NumberFormat(i18n.language);
    return { money: (n: number) => money.format(n), int: (n: number) => int.format(n) };
  }, [i18n.language]);
}
