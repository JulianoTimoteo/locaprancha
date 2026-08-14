import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { onSnapshotsInSync } from "firebase/firestore";

export type ConnectionStatus = "online" | "offline" | "syncing" | "connecting";

export function useConnectionStatus(): ConnectionStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribeSync = onSnapshotsInSync(db, () => {
      setIsSyncing(false);
    });

    const handleSyncStart = () => {
      if (navigator.onLine) {
        setIsSyncing(true);
      }
    };

    window.addEventListener("firestore-sync-start", handleSyncStart);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("firestore-sync-start", handleSyncStart);
      unsubscribeSync();
    };
  }, []);

  if (!isOnline) return "offline";
  if (isSyncing) return "syncing";
  return "online";
}
