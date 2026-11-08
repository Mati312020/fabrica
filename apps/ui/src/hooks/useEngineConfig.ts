import type { EngineConfig, EngineConfigInput } from "@fabrica/events";
import { useCallback, useEffect, useState } from "react";

/**
 * Motor elegido (local o remoto) y la acción de cambiarlo. Solo existe dentro de Electron: el token
 * viaja UI -> main y nunca vuelve. Si el cambio sale bien, la app se reinicia sola.
 */
export function useEngineConfig() {
  const bridge = window.fabrica?.engine;
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    void bridge?.getConfig().then(setConfig);
  }, [bridge]);

  const apply = useCallback(
    async (input: EngineConfigInput) => {
      if (!bridge) return;
      setBusy(true);
      const result = await bridge.setConfig(input);
      setBusy(false);
      setError(result.ok ? null : result.error);
      setRestarting(result.ok);
    },
    [bridge],
  );

  return { available: bridge !== undefined, config, remote: config?.mode === "remote", error, busy, restarting, apply };
}
