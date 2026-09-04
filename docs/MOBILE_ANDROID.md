# Application Android (notifications même app fermée)

## Ce qui est déjà en place

- `capacitor.config.ts` — app `com.taxiproxi.app` / « Taxi Proxi », charge le site publié.
- `android/` — projet Android natif généré (Capacitor).
- `src/lib/push.ts` + `src/hooks/useNativePush.ts` — demande l'autorisation, crée le canal
  « Courses » (priorité maximale, son) et enregistre le jeton de l'appareil du chauffeur.
- Table `device_tokens` — un jeton par téléphone, visible uniquement par son propriétaire.
- `src/lib/push.functions.ts` — `notifyNearbyDrivers` : au moment de la commande, envoie
  l'alerte (montant + destination + distance) aux chauffeurs sollicités via FCM.
  Sans Firebase relié, la fonction ne fait rien et le temps réel dans l'app prend le relais.

## Étapes restantes (côté compte)

1. Relier Firebase Cloud Messaging dans Lovable (connecteur « Firebase Cloud Messaging »).
2. Dans la console Firebase, ajouter une app Android avec le package `com.taxiproxi.app`,
   télécharger `google-services.json` et le placer dans `android/app/`.
3. Générer l'installable :
   ```bash
   npm run cap:sync
   npm run android:apk      # android/app/build/outputs/apk/release/
   npm run android:bundle   # .aab pour le Play Store
   ```
   (nécessite Android Studio / le SDK Android en local)

## iOS (plus tard)

`npx cap add ios`, un compte Apple Developer, un certificat APNs chargé dans Firebase.
