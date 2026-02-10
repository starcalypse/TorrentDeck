import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { warn as logWarn } from "@tauri-apps/plugin-log";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import type {
  ConnectionConfig,
  Rule,
  AppConfig,
  ConnectionStatus,
} from "@/types";

interface ConnectionContextValue {
  connection: ConnectionConfig;
  setConnection: React.Dispatch<React.SetStateAction<ConnectionConfig>>;
  updateConnection: <K extends keyof ConnectionConfig>(
    key: K,
    value: ConnectionConfig[K],
  ) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>;
  connectionMessage: string;
  setConnectionMessage: React.Dispatch<React.SetStateAction<string>>;
  handleTestConnection: () => Promise<void>;
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  buildConfig: () => AppConfig;
  appVersion: string;
  updateAvailable: Update | null;
  isUpdating: boolean;
  handleUpdate: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

const defaultPort = (client: string) =>
  client === "transmission" ? 9091 : 8080;

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<ConnectionConfig>({
    downloader_type: "qbittorrent",
    host: "127.0.0.1",
    port: 8080,
    username: "admin",
    password: "",
    use_https: false,
  });
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  const [rules, setRules] = useState<Rule[]>([
    { old_domain: "", new_domain: "", enabled: true },
  ]);

  const [appVersion, setAppVersion] = useState("");
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateChecked = useRef(false);

  // Load config on mount
  useEffect(() => {
    invoke<AppConfig>("load_config")
      .then((cfg) => {
        setConnection(cfg.connection);
        if (cfg.rules.length > 0) setRules(cfg.rules);
      })
      .catch((err) => logWarn(`Failed to load config: ${err}`));
  }, []);

  // Fetch version and check for updates on mount
  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
    if (updateChecked.current) return;
    updateChecked.current = true;
    check()
      .then((update) => {
        if (update?.available) setUpdateAvailable(update);
      })
      .catch(() => {});
  }, []);

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    setIsUpdating(true);
    try {
      await updateAvailable.downloadAndInstall();
      await relaunch();
    } catch {
      setIsUpdating(false);
    }
  };

  const buildConfig = useCallback(
    (): AppConfig => ({ connection, rules }),
    [connection, rules],
  );

  const saveConfig = useCallback(async () => {
    try {
      await invoke("save_config", { config: buildConfig() });
    } catch (err) {
      logWarn(`Failed to save config: ${err}`);
    }
  }, [buildConfig]);

  // Auto-save on config changes (debounced 800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveConfig();
    }, 800);
    return () => clearTimeout(timer);
  }, [saveConfig]);

  const updateConnection = <K extends keyof ConnectionConfig>(
    key: K,
    value: ConnectionConfig[K],
  ) => {
    setConnectionStatus("idle");
    setConnectionMessage("");
    setConnection((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "downloader_type") {
        next.port = next.use_https ? 443 : defaultPort(value as string);
      }
      if (key === "use_https") {
        next.port = value ? 443 : defaultPort(next.downloader_type);
      }
      return next;
    });
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    setConnectionMessage("");
    try {
      const msg = await invoke<string>("test_connection", { connection });
      setConnectionStatus("connected");
      setConnectionMessage(msg);
    } catch (err) {
      setConnectionStatus("error");
      setConnectionMessage(String(err));
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        connection,
        setConnection,
        updateConnection,
        connectionStatus,
        setConnectionStatus,
        connectionMessage,
        setConnectionMessage,
        handleTestConnection,
        rules,
        setRules,
        buildConfig,
        appVersion,
        updateAvailable,
        isUpdating,
        handleUpdate,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within ConnectionProvider");
  return ctx;
}
