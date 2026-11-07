import { useCallback, useEffect, useState } from "react";
import { useFabricaStore } from "../store/store";

/**
 * Estado y acciones de la API key. La key viaja solo UI -> main; nunca vuelve.
 * Fuera de Electron (`dev:web`) no hay puente y solo se muestra el estado del motor.
 */
export function useApiKey() {
  const bridge = window.fabrica;
  const engineConfigured = useFabricaStore((s) => s.domain.apiKeyConfigured);
  const [stored, setStored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void bridge?.apiKey.status().then((status) => setStored(status.configured));
  }, [bridge]);

  const save = useCallback(
    async (key: string) => {
      if (!bridge) return false;
      setBusy(true);
      const result = await bridge.apiKey.set(key.trim());
      setBusy(false);
      setError(result.ok ? null : result.error);
      if (result.ok) setStored(true);
      return result.ok;
    },
    [bridge],
  );

  const clear = useCallback(async () => {
    if (!bridge) return;
    await bridge.apiKey.clear();
    setStored(false);
    setError(null);
  }, [bridge]);

  return { available: bridge !== undefined, configured: bridge ? stored : engineConfigured, error, busy, save, clear };
}
