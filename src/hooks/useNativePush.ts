import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerDeviceToken } from "@/lib/push.functions";
import { enableNativePush } from "@/lib/push";

/**
 * Enregistre l'appareil du chauffeur connecté auprès de FCM pour recevoir
 * les appels de course même application fermée. Sans effet sur le web.
 */
export function useNativePush(userId: string | null) {
  const save = useServerFn(registerDeviceToken);
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || done.current === userId) return;
    done.current = userId;
    void enableNativePush(async (token, platform) => {
      try {
        await save({ data: { token, platform } });
      } catch (e) {
        console.error("registerDeviceToken", e);
      }
    });
  }, [userId, save]);
}
