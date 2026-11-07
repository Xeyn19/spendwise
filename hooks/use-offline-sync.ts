"use client";

import * as React from "react";
import { useOffline } from "next/offline";

import type { OfflineMutationResult } from "@/lib/offline/sync";
import { executeOfflineMutation } from "@/lib/offline/sync";
import {
  addPendingMutation,
  countPendingMutations,
  readPendingMutations,
  removePendingMutation,
} from "@/lib/offline/storage";
import type { OfflineMutation } from "@/lib/offline/types";

type UseOfflineSyncOptions = {
  userId: string;
  onMutationSynced: (mutation: OfflineMutation, result: OfflineMutationResult) => void;
};

export function useOfflineSync({ userId, onMutationSynced }: UseOfflineSyncOptions) {
  const frameworkOffline = useOffline();
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );
  const [pendingCount, setPendingCount] = React.useState(0);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const syncingRef = React.useRef(false);
  const onMutationSyncedRef = React.useRef(onMutationSynced);

  React.useEffect(() => {
    onMutationSyncedRef.current = onMutationSynced;
  }, [onMutationSynced]);

  const isOffline = frameworkOffline || browserOffline;

  const refreshPendingCount = React.useCallback(async () => {
    setPendingCount(await countPendingMutations(userId));
  }, [userId]);

  const syncNow = React.useCallback(async () => {
    if (syncingRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const mutations = await readPendingMutations(userId);

      for (const mutation of mutations) {
        const result = await executeOfflineMutation(mutation);

        if (!result.success) {
          setSyncError(result.message ?? "A pending change could not be synchronized.");
          break;
        }

        onMutationSyncedRef.current(mutation, result);
        await removePendingMutation(mutation.id);
        setPendingCount((current) => Math.max(0, current - 1));
      }
    } catch {
      if (navigator.onLine) {
        setSyncError("SpendWise could not reach the server. Your changes remain safely on this device.");
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount, userId]);

  const enqueue = React.useCallback(
    async (mutation: OfflineMutation) => {
      try {
        await addPendingMutation(mutation);
        setPendingCount((current) => current + 1);
        setSyncError(null);
        return true;
      } catch {
        setSyncError("This device could not save the change locally. Check available browser storage and try again.");
        return false;
      }
    },
    []
  );

  React.useEffect(() => {
    const updateBrowserStatus = () => setBrowserOffline(!navigator.onLine);
    const timeoutId = window.setTimeout(() => void refreshPendingCount(), 0);
    window.addEventListener("online", updateBrowserStatus);
    window.addEventListener("offline", updateBrowserStatus);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("online", updateBrowserStatus);
      window.removeEventListener("offline", updateBrowserStatus);
    };
  }, [refreshPendingCount]);

  React.useEffect(() => {
    if (!isOffline && pendingCount > 0) {
      const timeoutId = window.setTimeout(() => void syncNow(), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOffline, pendingCount, syncNow]);

  return {
    enqueue,
    isOffline,
    isSyncing,
    pendingCount,
    syncError,
    syncNow,
  };
}
