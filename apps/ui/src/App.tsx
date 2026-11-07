import { useCallback, useState } from "react";
import { Assembly } from "./components/Assembly";
import { Budget } from "./components/Budget";
import { Chat } from "./components/Chat";
import { Diagram } from "./components/Diagram";
import { SessionLog } from "./components/SessionLog";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { TopBar } from "./components/TopBar";
import { useEngine } from "./hooks/useEngine";

/** Pantalla principal (tablero 01): diagrama, montaje, chat, registro y presupuesto. */
export function App() {
  const { send } = useEngine();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <div className="flex h-full min-w-[1100px] flex-col">
      <TopBar send={send} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_328px] grid-rows-[minmax(0,1fr)_276px] gap-3 p-3">
        <Diagram />
        <Assembly />
        <div className="grid min-h-0 grid-cols-[minmax(0,430fr)_minmax(0,380fr)_minmax(0,242fr)] gap-3">
          <Chat send={send} />
          <SessionLog />
          <Budget send={send} />
        </div>
      </main>
      {settingsOpen ? <SettingsDrawer onClose={closeSettings} /> : null}
    </div>
  );
}
