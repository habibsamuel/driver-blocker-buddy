# Système de parrainage — Taxi Proxi

## Objectif
Chaque client reçoit un **code de parrainage unique** (ex: `TAXI-A3F9K2`). Il peut le partager. Quand un nouveau client s'inscrit avec ce code, les deux gagnent une récompense (ex: 500 XAF de crédit ou 1 course offerte).

## 1. Base de données (migration)

**Nouvelle colonne sur `profiles`:**
- `referral_code text unique` — généré automatiquement à la création du profil
- `referred_by uuid` — id du parrain (nullable, immuable après set)
- `referral_credit int not null default 0` — crédit gagné en XAF

**Nouvelle table `referrals`** (historique/audit) :
- `id uuid pk`
- `referrer_id uuid` (parrain)
- `referee_id uuid unique` (filleul — un client ne peut être parrainé qu'une fois)
- `code_used text`
- `reward_amount int` (ex: 500)
- `created_at timestamptz`

**Fonctions/triggers :**
- `generate_referral_code()` — génère `TAXI-XXXXXX` unique
- Modifier `handle_new_user()` pour :
  1. Générer un code de parrainage
  2. Lire `raw_user_meta_data->>'referral_code'` (code saisi à l'inscription)
  3. Résoudre le parrain, créer la ligne `referrals`, créditer les deux profils
- RLS + GRANT selon les règles du projet

## 2. Frontend

**`src/routes/auth.tsx`** — ajouter un champ optionnel "Code de parrainage" au formulaire d'inscription, envoyé via `options.data.referral_code`.

**Nouvel écran `src/features/Parrainage.tsx`** (route `/parrainage`) accessible depuis le menu client :
- Affiche le code du client avec bouton "Copier"
- Bouton "Partager" (Web Share API + fallback WhatsApp)
- Compteur : nombre de filleuls + crédit total gagné
- Liste des filleuls (nom masqué : `Jean D.`)
- Explication : "Invitez un ami, gagnez 500 XAF chacun à sa première course"

**`src/components/Layout.tsx`** — ajouter l'entrée "Parrainage" dans la navigation client.

## 3. Récompense (choix)
Deux options — je prends la 1re par défaut sauf si vous préférez la 2e :
1. **Crédit affiché** : `referral_credit` s'accumule, affiché comme "solde parrainage" (aucune intégration paiement nécessaire tout de suite)
2. **Course offerte** : flag `free_ride_available` déduit lors de la prochaine réservation

## Détails techniques
- Code format `TAXI-` + 6 chars base32 (Crockford, sans I/O/0/1) — lisible et sans ambiguïté
- Anti-auto-parrainage : trigger vérifie `referrer_id != referee_id`
- Anti-cumul : `referee_id unique` sur `referrals`
- Génération code : boucle avec retry sur collision (extrêmement rare)
- RLS : le client voit uniquement ses propres filleuls via `referrer_id = auth.uid()`

## Ce que je vais livrer
1. Migration SQL (colonnes, table, trigger modifié, RLS, GRANTs)
2. Champ code parrainage dans `/auth` (inscription)
3. Page `/parrainage` avec code, partage, statistiques
4. Entrée menu

Voulez-vous que je parte sur la **récompense en crédit (option 1)** et que j'implémente maintenant ?
