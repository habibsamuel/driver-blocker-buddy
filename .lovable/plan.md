# Parcours multi-écrans TAXI PROXI

## Résultat
- Transformer la page actuelle en un parcours mobile fluide de trois interfaces successives, sans changer de page.
- Écran 1 : carte claire de Yaoundé, en-tête flottant, raccourcis, recherche, catégories et destinations récentes.
- Écran 2 : trajet visible, résumé Poste Centrale → Bastos VIP, choix Standard/Confort et paiement en espèces.
- Écran 3 : navigation active, itinéraire vert, indications, progression et fiche chauffeur complète.
- Permettre le retour à l’étape précédente et une démonstration complète depuis la réservation jusqu’au suivi.

## Direction visuelle
- Reprendre la charte fournie : blanc et gris clair, texte ardoise, jaune taxi et vert réservé à la validation et au trajet.
- Conserver une carte plein écran dominante et des panneaux inférieurs blancs aux grands arrondis.
- Utiliser des véhicules visuels et des icônes soignées, avec les repères locaux de Yaoundé.
- Appliquer des transitions de 300 ms aux changements d’écran, panneaux, sélections et menus, avec réduction des animations respectée.

## Contenu et comportement
- Les raccourcis et destinations récentes remplissent la destination et ouvrent le choix du véhicule.
- Le choix du véhicule met à jour le tarif, le délai et le bouton de confirmation.
- Le paiement reste uniquement en espèces, conformément au fonctionnement actuel du projet.
- La confirmation ouvre le suivi actif avec chauffeur vérifié, plaque camerounaise, ETA, appels, partage et SOS.
- Les valeurs de démonstration du document restent une simulation visuelle tant que la vraie commande n’est pas reconnectée.

## Détails techniques
- Étendre l’écran de réservation en états ciblés et faire évoluer la carte selon l’étape affichée.
- Réutiliser les boutons et couleurs du projet ; garder la carte compatible avec le rendu initial de l’application.
- Corriger les erreurs actuelles de la page racine avant validation.
- Vérifier l’affichage mobile et bureau, les interactions, la compilation et les erreurs d’exécution.