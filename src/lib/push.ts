/**
 * Notifications natives (Android/iOS via FCM).
 * Sur le web, on ne fait rien : le temps réel Supabase couvre l'app ouverte.
 */
export type PushStatus = "registered" | "not-native" | "denied" | "error";

export async function isNativeApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Demande l'autorisation, s'enregistre auprès de FCM et renvoie le jeton
 * de l'appareil (à stocker côté serveur pour cibler les envois).
 */
export async function enableNativePush(
  onToken: (token: string, platform: "android" | "ios") => void | Promise<void>,
): Promise<PushStatus> {
  if (!(await isNativeApp())) return "not-native";
  try {
    const { Capacitor } = await import("@capacitor/core");
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return "denied";

    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener("registration", (t) => {
      void onToken(t.value, platform);
    });
    await PushNotifications.addListener("registrationError", (e) => {
      console.error("push registration error", e);
    });

    if (platform === "android") {
      try {
        await PushNotifications.createChannel({
          id: "rides",
          name: "Courses",
          description: "Appels de course entrants",
          importance: 5,
          visibility: 1,
          sound: "default",
          vibration: true,
        });
      } catch (e) {
        console.error("createChannel", e);
      }
    }

    await PushNotifications.register();
    return "registered";
  } catch (e) {
    console.error("enableNativePush", e);
    return "error";
  }
}
