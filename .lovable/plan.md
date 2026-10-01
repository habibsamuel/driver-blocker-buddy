# Refonte UI/UX mobile TAXI PROXI

## Objectif
Créer un parcours mobile fluide et premium pour les taxis jaunes conventionnels de Yaoundé, en conservant la carte Google en couleurs naturelles, le jaune/noir TAXI PROXI et toutes les fonctions de course existantes.

## Ce qui sera construit
- Recomposer l’écran de réservation autour d’une carte plein écran et de panneaux en verre liquide, adaptés au téléphone.
- Décliner les six états du document dans le parcours réel : recherche, chauffeur assigné/arrivé, course, suivi étendu, détails chauffeur et course terminée.
- Faire évoluer automatiquement l’interface selon l’étape réelle de la course, sans modifier le calcul du prix, l’affectation, le suivi GPS ou le paiement en espèces.
- Ajouter des illustrations Microsoft Fluent Emoji 3D réalistes pour le taxi, le chauffeur, la position, la sécurité et la confirmation, avec un usage mesuré et cohérent.
- Afficher les informations locales demandées : FCFA, plaques camerounaises, badge CUY, quartiers de Yaoundé, itinéraire jaune et repères de trajet.
- Ajouter les actions utiles aux bons moments : appel, partage, position en direct, détails chauffeur, annulation et retour à l’accueil.

## Direction visuelle
- Noir profond et anthracite pour les panneaux, jaune taxi pour les actions et l’itinéraire, vert uniquement pour confirmer.
- Carte Google standard en couleurs naturelles, toujours dominante et automatiquement recadrée.
- Verre liquide lisible, ombres douces, coins généreux et mouvements courts respectant la réduction des animations.
- Sora pour les titres et Manrope pour le texte.

## Détails techniques
- Intégrer les emojis Fluent 3D comme ressources locales pour préserver le fonctionnement hors connexion.
- Étendre les composants de suivi et de fiche chauffeur au lieu de dupliquer la logique métier.
- Garder les boutons du système existant et les couleurs sémantiques du thème.
- Vérifier les états mobile et bureau, les interactions, les erreurs d’exécution et la compilation après la refonte.
