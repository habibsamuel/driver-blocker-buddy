// Configuration pour APK (React Native / Expo build)
export default {
  expo: {
    name: "Taxi Proxi",
    slug: "taxi-proxi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./public/icon-192.png",
    userInterfaceStyle: "light",
    
    splash: {
      image: "./public/icon-192.png",
      resizeMode: "contain",
      backgroundColor: "#FFD400"
    },

    assetBundlePatterns: ["**/*"],
    
    ios: {
      supportsTabletMode: false,
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./public/icon-192.png",
        backgroundColor: "#FFD400"
      },
      package: "com.taxiproxi.app"
    },

    web: {
      favicon: "./public/favicon.png",
    },

    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermissions: true,
        }
      ]
    ],

    extra: {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    }
  }
};
