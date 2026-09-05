# Règles ProGuard/R8 pour l'application Taxi Proxi (Capacitor + WebView)

# Interfaces JavaScript exposées à la WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor et ses plugins (chargés par réflexion)
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod <methods>;
}

# Cordova (ponts éventuels)
-keep class org.apache.cordova.** { *; }

# Firebase Cloud Messaging
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Traces d'erreur lisibles dans la console Play
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
