import { useEffect, useState } from "react";

interface NetworkInformation extends EventTarget {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
}

interface NetworkState {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

const getConnection = (): NetworkInformation | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return (
    (navigator as unknown as { connection?: NetworkInformation }).connection ??
    (navigator as unknown as { mozConnection?: NetworkInformation }).mozConnection ??
    (navigator as unknown as { webkitConnection?: NetworkInformation }).webkitConnection
  );
};

const useNetworkStatus = (): NetworkState => {
  const [state, setState] = useState<NetworkState>(() => ({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    effectiveType: getConnection()?.effectiveType,
    downlink: getConnection()?.downlink,
    rtt: getConnection()?.rtt,
    saveData: getConnection()?.saveData,
  }));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const connection = getConnection();

    const update = () => {
      setState({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    const handleConnectionChange = () => update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    connection?.addEventListener?.("change", handleConnectionChange);

    update();

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection?.removeEventListener?.("change", handleConnectionChange);
    };
  }, []);

  return state;
};

export default useNetworkStatus;
