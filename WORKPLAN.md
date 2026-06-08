# 🚖 TAXI PROXI - SCHÉMA DE TRAVAIL ITÉRATIF

## 📋 PLAN D'AMÉLIORATION (PHASED APPROACH)

### PHASE 1: FONDATIONS SOLIDES (DATABASE SYNC) ✅ CURRENT
**Objectif:** Éliminer la perte de données au refresh

#### Étape 1.1: Créer le schéma DB complet
- [ ] Table `drivers` (persist vehicle, subscription status)
- [ ] Table `rides` (persist courses, pas juste localStorage)
- [ ] Table `unlock_codes` (persist unlock attempts)
- [ ] Ajouter indexes pour performance
- [ ] Tester RLS policies

#### Étape 1.2: Synchroniser Zustand ↔ Supabase
- [ ] Créer hooks: `useDriversSync()`, `useRidesSync()`
- [ ] Implémenter optimistic updates
- [ ] Gérer conflicts (offline-first)
- [ ] Tester: offline mode, reconnection

#### Étape 1.3: Tester avant/après
- [ ] Unit tests: sync logic
- [ ] Integration tests: DB persistence
- [ ] E2E test: refresh page = data restored

---

### PHASE 2: SÉCURITÉ CRITIQUE 🔒
**Objectif:** Corriger les vulnérabilités identifiées

#### Étape 2.1: Sécuriser les PINs
- [ ] Hash PINs avec bcrypt
- [ ] Ajouter rate-limiting (3 tentatives → 15 min block)
- [ ] Audit log chaque tentative
- [ ] Tester brute-force protection

#### Étape 2.2: Admin mode sécurisé
- [ ] Remplacer in-memory boolean par JWT roles
- [ ] Ajouter 2FA (TOTP) pour admin
- [ ] Admin audit log (toutes les actions)
- [ ] Tester unauthorized access

#### Étape 2.3: Validation server-side
- [ ] Ajouter validation dans tous les ServerFn
- [ ] Vérifier CORS/CSRF
- [ ] Tester injection attacks

---

### PHASE 3: LOGIQUE MÉTIER CORRECTE 🚗
**Objectif:** Fixes métier (blocking logic, promo, etc.)

#### Étape 3.1: Driver blocking logic
- [ ] Persister `blocked` status en DB, pas mémoire
- [ ] Corriger `checkAndBlockDrivers()` - run côté serveur
- [ ] Créer dashboard admin pour débloquer drivers
- [ ] Tester: block après 48h inactivité, débloquer via unlock code

#### Étape 3.2: Promo codes
- [ ] Persister promo codes en DB
- [ ] Ajouter expiration dates
- [ ] Limiter usage (max 1x par user)
- [ ] Tester: apply promo, check discount

#### Étape 3.3: Tarification transparente
- [ ] Tous calculs côté server (pas client)
- [ ] Log tous les tarifs pour audit
- [ ] Ajouter commission platform (%) - configurable par admin
- [ ] Tester: tarif calculé correctement

---

### PHASE 4: TESTS & QUALITÉ 🧪
**Objectif:** 50% test coverage minimum

#### Étape 4.1: Unit tests
- [ ] Tests: `computeFare()`, validation functions
- [ ] Tests: store actions (addDriver, startRide, etc.)

#### Étape 4.2: Integration tests
- [ ] Tests: auth flow
- [ ] Tests: ride booking flow
- [ ] Tests: driver blocking

#### Étape 4.3: E2E tests
- [ ] User journey: Client booking
- [ ] User journey: Driver accepting
- [ ] User journey: Ride completion

---

### PHASE 5: FEATURES MANQUANTES ⚡
**Objectif:** Compléter MVP

#### Étape 5.1: Real-time tracking
- [ ] WebSocket driver positions (Supabase Realtime)
- [ ] Map live
- [ ] Tester: position updates in real-time

#### Étape 5.2: Better UX
- [ ] Error boundaries
- [ ] Loading states
- [ ] Optimistic updates
- [ ] Offline detection

#### Étape 5.3: Admin tools
- [ ] Dashboard driver management
- [ ] Settings management
- [ ] Analytics/reports

---

## 🔄 WORKFLOW ITÉRATIF

Pour CHAQUE étape:

```
1. CODE: Écrire le code/migration
2. TEST: Vérifier localement
3. COMMIT: Push changements
4. VALIDATE: Exécuter tests
5. NEXT: Étape suivante
```

---

## ✅ CHECKPOINTS DE VALIDATION

**Après Phase 1:** ✓ Data persists après refresh  
**Après Phase 2:** ✓ Pas de brute-force possible  
**Après Phase 3:** ✓ Blocking logic fonctionne  
**Après Phase 4:** ✓ Tests passent  
**Après Phase 5:** ✓ MVP complet

---

## 📊 PRIORITÉ DES FIXES

```
🔴 URGENT (Jour 1):
  - Fix: drivers/rides not persisted
  - Fix: PIN brute-force vulnerability
  - Fix: admin mode in-memory bypass

🟠 IMPORTANT (Jour 2-3):
  - Fix: blocking logic not server-side
  - Add: rate-limiting
  - Add: server validation

🟡 NICE-TO-HAVE (Jour 4+):
  - Real-time tracking
  - Better error handling
  - Tests
```

---

**Status:** Ready to start Phase 1.1  
**Next:** Create Supabase migrations

