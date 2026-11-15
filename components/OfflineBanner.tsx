"use client";

import { useSyncExternalStore } from "react";
import { IconWifiOff } from "@/components/icons";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 bg-debris px-4 py-2 text-center text-sm font-semibold text-white"
    >
      <IconWifiOff size={18} />
      Você está offline. Os últimos dados salvos neste aparelho continuam disponíveis.
    </div>
  );
}
