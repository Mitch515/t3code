import { useCallback, useEffect, useState } from "react";
import type { DesktopConnectionInfo, DesktopConnectionSettings } from "@t3tools/contracts";

import { isElectron } from "./env";

export const DEFAULT_DESKTOP_CONNECTION_SETTINGS: DesktopConnectionSettings = {
  mode: "local",
  remoteServerUrl: "",
  remoteAuthToken: "",
};

export const DEFAULT_DESKTOP_CONNECTION_INFO: DesktopConnectionInfo = {
  settings: DEFAULT_DESKTOP_CONNECTION_SETTINGS,
  effectiveMode: "local",
  wsUrl: null,
  canPickFolder: true,
  requiresServerPaths: false,
  usingLocalBackend: true,
  fallbackReason: null,
};

export function useDesktopConnectionInfo() {
  const [connectionInfo, setConnectionInfo] = useState<DesktopConnectionInfo | null>(
    isElectron ? null : DEFAULT_DESKTOP_CONNECTION_INFO,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.desktopBridge?.getConnectionInfo) {
      setConnectionInfo(DEFAULT_DESKTOP_CONNECTION_INFO);
      setError(null);
      return DEFAULT_DESKTOP_CONNECTION_INFO;
    }

    try {
      const next = await window.desktopBridge.getConnectionInfo();
      setConnectionInfo(next);
      setError(null);
      return next;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to read desktop connection settings.";
      setError(message);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    connectionInfo,
    refresh,
    error,
    isLoading: isElectron && connectionInfo === null && error === null,
  } as const;
}
