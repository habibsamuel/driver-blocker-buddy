import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Application mobile native (Android d'abord).
 * L'app est rendue par le serveur : le conteneur natif charge le site publié,
 * tout en gardant les notifications push natives (FCM) et l'écran de démarrage.
 */
const config: CapacitorConfig = {
  appId: "com.taxiproxi.app",
  appName: "Taxi Proxi",
  webDir: "dist/client",
  server: {
    url: "https://taxiproxicamer.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
