# Refonte TAXI PROXI inspirée de Yango

## Résultat
- Remplacer l’expérience actuelle par une seule page mobile plein écran.
- Afficher une carte Mapbox centrée sur les coordonnées demandées, avec la position utilisateur et quelques taxis proches.
- Superposer un en-tête transparent et un panneau inférieur blanc, fluide et redimensionnable.
- Reprendre les champs de départ/destination, les trois catégories Moto, Eco et Confort, puis un bouton de commande jaune.
- Conserver les suggestions de destination et la géolocalisation existantes lorsque disponibles.
- Retirer les anciennes pages visibles et supprimer l’habillage général pour que la carte occupe tout l’écran.

## Direction visuelle
- Marque TAXI PROXI en noir et jaune `#FFC300`.
- Interface propre, dense et tactile, adaptée en priorité aux téléphones.
- Micro-animations discrètes sur le panneau, les véhicules et les actions.

## Détails techniques
- Charger `mapbox-gl` uniquement dans le navigateur avec `VITE_MAPBOX_TOKEN`.
- Prévoir un état clair si le jeton Mapbox manque, sans écran vide.
- Garder les contrôles accessibles, les zones sûres mobiles et les métadonnées de la page d’accueil.
- Vérifier l’affichage sur téléphone et ordinateur ainsi que les erreurs de compilation.
