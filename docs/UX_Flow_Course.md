# Taxi Proxi — Flux de commande d'une course (UX/UI)

## 1. Flux utilisateur étape par étape

| # | Écran | Action utilisateur | Réaction système |
|---|-------|--------------------|------------------|
| 1 | `/course` — Accueil commande | Ouvre l'écran | GPS activé, position détectée, carte claire (thème « vivid ») avec chauffeurs en ligne autour |
| 2 | Saisie destination | Tape 2+ lettres | Suggestions Google Places **biaisées sur un rayon de 15 km** autour de la position : repères connus, quartiers, rues adjacentes (max 6) |
| 3 | Sélection d'une suggestion | Clique une proposition | La carte passe en **plein écran dynamique**, l'itinéraire est calculé (Routes API) et tracé en **vert vif #22c55e (épaisseur 7 + liseré blanc 12)**, cadrage automatique `fitBounds` sur départ + destination |
| 4 | Feuille inférieure — véhicule | Choisit Bend-Skin / Éco / Confort | Nombre de chauffeurs dispo par catégorie, tarif dynamique recalculé (km + min, arrondi 50 XAF) |
| 5 | Feuille inférieure — récap | Code promo optionnel, « Commander » | Recherche du chauffeur **le plus proche et le mieux noté**, notification, création de la course |
| 6 | Écran de confirmation | Attend | Carte plein écran + **fiche chauffeur en bas d'écran** : photo, nom & prénom, plaque, modèle + couleur, ETA. PIN de départ, total à payer en liquide |
| 7 | Course en cours | Suit | Itinéraire recalculé automatiquement à chaque déplacement GPS (> 40 m), progression par étapes : recherche → en route → arrivé → en course → arrivé à destination |

Retour possible à l'étape 2 à tout moment via la flèche « ← » en haut à gauche de la carte plein écran.

## 2. Composants UI par écran

### Écran A — Commande (état compact)
- **Header** : titre « Où allez-vous ? » + sous-titre rassurant.
- **MapView (h-56, theme="vivid")** : fond clair `#f4f2ec`, routes blanches, axes artériels `#ffe9a8`, autoroutes `#ffcc00`, parcs `#bfe3b4`, eau `#9fd3e8`, **labels POI + noms de rues activés**. Marqueurs : moi (bleu), chauffeurs (jaune 🚖).
- **Bandeau GPS** : icône `Locate` verte + « Position détectée — N chauffeur(s) en ligne ».
- **Carte « 1. Votre destination »** : `DestinationInput` (icône Navigation à gauche, spinner à droite, liste de suggestions en popover : icône 📍 + libellé principal en gras + contexte quartier/ville en gris).
- **Carte « 2. Type de véhicule »** : 3 tuiles sélectionnables (icône, libellé, sous-titre, « N dispo »), bordure jaune quand active.
- **Carte « 3. Récapitulatif »** : promo, distance/durée, prix total (3xl jaune), badge « 💵 Paiement en liquide », CTA `Commander — X XAF`.

### Écran B — Carte plein écran (destination choisie)
- Conteneur `fixed inset-0 z-40 flex flex-col`.
- **Zone carte `flex-1`** : MapView vivid plein écran, itinéraire vert + repères Départ (vert) / Destination (rouge), cadrage auto.
- **Bouton retour** : rond translucide `backdrop-blur` en haut à gauche.
- **Chip destination** : carte flottante translucide — nom du lieu + « X km · Y min depuis votre position ».
- **Bottom sheet scrollable (`max-h-58vh`)** : étapes 2 et 3 (véhicule + récap + CTA).

### Écran C — Confirmation & suivi
- **Carte plein écran** (même style) + chip « Course confirmée 🚖 — Vers <destination> ».
- **Bottom sheet (`max-h-62vh`)** :
  - `RideProgress` : barre d'avancement + stepper 5 étapes + minuteur.
  - `DriverInfoCard` : avatar photo 64px (initiales en fallback), nom & prénom, note ★, modèle + **pastille de couleur** + nom de la couleur, plaque en monospace `tracking-widest`, **ETA** dans un bloc jaune, bouton d'appel rond.
  - Bloc PIN de départ (4 chiffres, `tracking-[0.4em]`).
  - Total à payer en liquide + actions « Nouvelle course » / « Voir l'historique ».

### Tokens visuels
Jaune primaire `#FFCC00` (marque), fond sombre pour l'app / carte claire pour la map, vert `#22c55e` pour l'itinéraire, rouge `#ef4444` pour la destination, rayons `rounded-2xl`, ombres douces, typo bold pour les chiffres clés.

## 3. Prompts pour maquettes

### Midjourney / image
1. `Mobile ride-hailing app UI, full-screen colorful city map of Yaoundé Cameroon, bright cream streets with yellow arterial roads, green parks, labeled neighborhoods and street names, vivid green route line with white casing connecting a green start pin to a red destination pin, floating translucent destination chip at top, bottom sheet with driver card (avatar, name, license plate, car model, ETA), dark UI with #FFCC00 yellow accents, rounded 24px cards, soft shadows, clean product design, 9:16 --style raw --v 6`
2. `Ride-hailing destination search screen, dark mobile UI, input field with location icon, dropdown list of 5 nearby place suggestions with pin icons and neighborhood subtitles, colorful map peeking behind, yellow #FFCC00 accents, high fidelity product mockup, 9:16`
3. `Driver info bottom sheet component, circular driver photo, 4.9 star rating, license plate in monospace, car model with color swatch dot, yellow ETA block "4 min", round call button, dark card with yellow border, ultra clean UI design, 3:2`

### Figma (prompt First Draft / plugin IA)
> Crée un flux mobile 3 écrans pour une app de taxi à Yaoundé, thème sombre avec accent jaune #FFCC00 :
> 1) Écran commande : carte claire colorée (h 220px), champ destination avec liste de 5 suggestions de lieux proches, 3 tuiles de véhicule (Bend-Skin, Éco, Confort), bloc récapitulatif avec prix XAF et bouton « Commander ».
> 2) Écran carte plein écran : itinéraire vert vif entre pin départ et pin destination, chip destination flottante avec distance/durée, bottom sheet 58% avec choix véhicule et prix.
> 3) Écran confirmation : carte plein écran + bottom sheet avec barre de progression 5 étapes, fiche chauffeur (photo, nom, note, plaque, modèle + couleur, ETA, bouton appeler) et code PIN à 4 chiffres.
> Composants en Auto Layout, coins 24px, styles de texte : Display Bold pour les chiffres, Body 14 pour les libellés.
