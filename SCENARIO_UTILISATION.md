# SCÉNARIOS D'UTILISATION — PROJET CLOUD S5

## Architecture du Projet

| Service      | Technologie           | Port | Rôle                          |
|-------------|----------------------|------|-------------------------------|
| db          | PostgreSQL 15         | 5432 | Base de données relationnelle |
| backend     | Spring Boot (Java)    | 8080 | API REST + JWT                |
| tileserver  | TileServer GL         | 8081 | Tuiles carte Antananarivo     |
| frontend    | React + Vite          | 5173 | Application web (Manager)     |
| mobile      | Ionic + Vue 3         | 5174 | Application mobile            |

---

## SCÉNARIO 1 : Lancement de la plateforme

### Étape 1.1 — Démarrer tous les services Docker
```bash
docker compose up -d
```
Les 5 services démarrent : **db** → **backend** → **tileserver**, **frontend**, **mobile**

### Étape 1.2 — Accéder aux applications
- **Web** : http://localhost:5173
- **Mobile** : http://localhost:5174
- **API Swagger** : http://localhost:8080/swagger-ui.html
- **TileServer** : http://localhost:8081

---

## SCÉNARIO 2 : Visiteur — Consultation de la carte (Web)

> **Rôle** : Visiteur (sans authentification)

### Étape 2.1 — Accéder à la carte
1. Ouvrir http://localhost:5173
2. Cliquer sur **"Continuer en tant que visiteur"** sur la page de connexion
3. La carte d'Antananarivo s'affiche avec les points de signalement en rouge

### Étape 2.2 — Consulter un signalement
1. Survoler un point rouge sur la carte
2. Une popup apparaît avec :
   - 📅 Date du signalement
   - 📊 Statut (Nouveau / En cours / Terminé)
   - 📐 Surface en m²
   - 💰 Budget estimé
   - 🏢 Entreprise concernée
   - 📷 Lien vers les photos

### Étape 2.3 — Lire le tableau récapitulatif
Le panneau latéral affiche :
- **Nombre de points** signalés
- **Surface totale** en m²
- **Avancement** en % (Nouveau=0%, En cours=50%, Terminé=100%)
- **Budget total** en €

---

## SCÉNARIO 3 : Inscription et Connexion (Web)

### Étape 3.1 — Créer un compte
1. Ouvrir http://localhost:5173
2. Cliquer **"S'inscrire"**
3. Remplir :
   - Nom complet
   - Email
   - Mot de passe (min. 6 caractères)
4. Cliquer **"Créer mon compte"**
5. ✅ Redirection automatique vers la carte

### Étape 3.2 — Se connecter
1. Ouvrir http://localhost:5173
2. Saisir email et mot de passe
3. Cocher **"Se souvenir de moi"** (optionnel)
4. Cliquer **"Se connecter"**
5. ✅ Accès à la carte avec le rôle affiché

### Étape 3.3 — Blocage après 3 tentatives échouées
1. Saisir un mot de passe incorrect 3 fois
2. ❌ Le compte est automatiquement bloqué
3. Message : "Compte bloqué après trop de tentatives"
4. → Seul un Manager peut débloquer le compte

---

## SCÉNARIO 4 : Manager — Dashboard d'administration (Web)

> **Rôle** : Manager (authentifié avec rôle MANAGER)
> **Compte par défaut** : `manager@cloud.local` / `manager123`

### Étape 4.1 — Accéder au Dashboard
1. Se connecter avec le compte Manager
2. Cliquer sur **"Dashboard"** dans le menu latéral
3. Le panneau d'administration s'affiche avec 3 sections

### Étape 4.2 — Configurer l'application
1. Dans la section **"⚙️ Configuration Application"**
2. Modifier les paramètres :
   - **Durée de session** (en minutes)
   - **Nombre max de tentatives** de connexion
   - **Durée de blocage** (en minutes)
3. Les valeurs se sauvegardent automatiquement

### Étape 4.3 — Synchroniser Firebase ↔ PostgreSQL
1. Dans la section **"🔄 Synchronisation"**
2. Cliquer **"Synchroniser"**
3. Le résultat affiche :
   - Utilisateurs : X nouveaux, Y mis à jour
   - Signalements : X nouveaux, Y mis à jour
   - Logs détaillés (cliquables)
4. ✅ Les données du mobile sont maintenant dans PostgreSQL

### Étape 4.4 — Débloquer un utilisateur
1. Dans la section **"Débloquer un utilisateur"**
2. Saisir l'email de l'utilisateur bloqué
3. Cliquer **"Débloquer"**
4. ✅ Le compte est débloqué

---

## SCÉNARIO 5 : Manager — Gestion des Signalements (Web)

### Étape 5.1 — Voir tous les signalements
1. Cliquer **"Signalements"** dans le menu
2. Le tableau affiche tous les signalements avec :
   - Images (miniatures cliquables)
   - Titre, Description
   - Coordonnées GPS
   - Surface m², Budget €
   - Email de l'utilisateur
   - Statut (modifiable)
   - Historique des dates

### Étape 5.2 — Changer le statut d'un signalement
1. Dans la colonne **"Statut"**, ouvrir la liste déroulante
2. Choisir parmi : Nouveau → En attente → En cours → Terminé / Annulé
3. ✅ Le statut est mis à jour immédiatement
4. La date correspondante est enregistrée dans l'historique

### Étape 5.3 — Modifier les informations d'un signalement
1. Modifier la surface, le budget ou l'entreprise concernée
2. Les modifications sont sauvegardées
3. Les statistiques se mettent à jour automatiquement

---

## SCÉNARIO 6 : Manager — Gestion des Utilisateurs (Web)

### Étape 6.1 — Voir la liste des utilisateurs
1. Cliquer **"Utilisateurs"** dans le menu
2. Le tableau affiche :
   - Email
   - Nom
   - Rôle (badge coloré)
   - Statut (Actif / Bloqué)
   - Tentatives échouées
   - Bouton d'action

### Étape 6.2 — Débloquer un utilisateur
1. Identifier l'utilisateur avec le badge **"Bloqué"** (rouge)
2. Cliquer **"Débloquer"**
3. ✅ L'utilisateur peut à nouveau se connecter

---

## SCÉNARIO 7 : Manager — Statistiques (Web)

### Étape 7.1 — Consulter les statistiques
1. Cliquer **"Statistiques"** dans le menu
2. Les métriques principales s'affichent :
   - 📍 Nombre total de points
   - 📐 Surface totale (m²)
   - 💰 Budget total (€)
   - 📊 Avancement global (%)

### Étape 7.2 — Répartition par statut
- Barres de progression colorées montrant :
  - 🔵 NOUVEAU : X%
  - 🟡 EN COURS : Y%
  - 🟢 TERMINÉ : Z%

### Étape 7.3 — Délais de traitement
- Tableau des délais moyens :
  - Signalement → En cours : X jours
  - En cours → Terminé : Y jours
  - Délai total moyen : Z jours

### Calcul de l'avancement
- **Nouveau** = 0%
- **En cours** = 50%
- **Terminé** = 100%
- **Avancement global** = moyenne pondérée de tous les signalements

---

## SCÉNARIO 8 : Profil Utilisateur (Web)

### Étape 8.1 — Modifier son profil
1. Cliquer **"Profil"** dans le menu
2. Le formulaire affiche :
   - Email (lecture seule)
   - Nom complet (modifiable)
   - Rôle (lecture seule)
3. Modifier le nom si souhaité

### Étape 8.2 — Changer son mot de passe
1. Saisir un nouveau mot de passe
2. Confirmer le mot de passe
3. Cliquer **"Enregistrer"**
4. ✅ Mot de passe mis à jour

---

## SCÉNARIO 9 : Utilisateur Mobile — Connexion

> **Rôle** : Utilisateur mobile
> **Note** : L'inscription se fait uniquement via le web par le Manager

### Étape 9.1 — Se connecter
1. Ouvrir l'application mobile
2. Saisir email et mot de passe
3. Cliquer **"Se connecter"**
4. ✅ Authentification via Firebase
5. Redirection vers la carte

---

## SCÉNARIO 10 : Utilisateur Mobile — Signaler un problème

### Étape 10.1 — Localiser le problème
1. La carte Leaflet s'affiche centrée sur Antananarivo
2. Cliquer sur le bouton **GPS** (en bas à droite) pour activer la géolocalisation
3. Le point bleu animé indique votre position

### Étape 10.2 — Créer un signalement
1. **Toucher la carte** à l'emplacement du problème
2. Un formulaire modal apparaît avec :
   - 📍 Coordonnées (pré-remplies)
   - 📝 Titre du signalement
   - 📋 Description détaillée
   - 📐 Surface en m²
   - 💰 Budget estimé en €

### Étape 10.3 — Ajouter des photos
1. Cliquer sur **"Choisir des images"**
2. Sélectionner une ou plusieurs photos
3. Les aperçus s'affichent sous forme de vignettes
4. Possibilité de supprimer une photo (❌)

### Étape 10.4 — Enregistrer
1. Cliquer **"Enregistrer"**
2. ✅ Le signalement est envoyé à Firebase Firestore
3. Le marqueur apparaît immédiatement sur la carte
4. Statut initial : **NOUVEAU**

---

## SCÉNARIO 11 : Utilisateur Mobile — Consulter les signalements

### Étape 11.1 — Voir tous les signalements
1. La carte affiche tous les signalements en rouge avec animation radar
2. Les marqueurs sont visibles par tous les utilisateurs

### Étape 11.2 — Filtrer mes signalements
1. Activer le toggle **"Mes signalements uniquement"**
2. Seuls vos propres signalements restent affichés
3. Désactiver pour revoir tous les signalements

---

## SCÉNARIO 12 : Notifications Push (Mobile)

### Étape 12.1 — Recevoir une notification
1. Le Manager change le statut d'un de vos signalements (ex: Nouveau → En cours)
2. La synchronisation Firebase est déclenchée
3. 📱 Notification push reçue sur le téléphone :
   - "Votre signalement [Titre] est maintenant En cours"

---

## SCÉNARIO 13 : Flux complet bout en bout

```
┌─────────────────────────────────────────────────────────┐
│                    FLUX COMPLET                          │
│                                                         │
│  1. Manager crée un compte utilisateur (Web)            │
│           ↓                                             │
│  2. Utilisateur se connecte (Mobile)                    │
│           ↓                                             │
│  3. Utilisateur signale un problème sur la carte        │
│     → Ajoute titre, description, photos                 │
│     → Données → Firebase Firestore                      │
│           ↓                                             │
│  4. Manager clique "Synchroniser" (Web)                 │
│     → Firebase → PostgreSQL                             │
│           ↓                                             │
│  5. Manager voit le signalement dans le tableau (Web)   │
│     → Modifie statut : NOUVEAU → EN_COURS               │
│     → Renseigne surface, budget, entreprise             │
│           ↓                                             │
│  6. Visiteur consulte la carte (Web)                    │
│     → Voit le point avec les infos mises à jour         │
│     → Tableau récapitulatif avec avancement             │
│           ↓                                             │
│  7. Utilisateur reçoit notification (Mobile)            │
│     → "Votre signalement est en cours"                  │
│           ↓                                             │
│  8. Manager termine le signalement                      │
│     → Statut : EN_COURS → TERMINE                       │
│     → Avancement passe à 100%                           │
│           ↓                                             │
│  9. Statistiques mises à jour (Web)                     │
│     → % avancement global recalculé                     │
│     → Délais moyens de traitement affichés              │
└─────────────────────────────────────────────────────────┘
```

---

## SCÉNARIO 14 : Serveur de cartes hors ligne

### Étape 14.1 — Cartes vectorielles Docker
1. Le TileServer GL sert les tuiles d'Antananarivo en local
2. Données : fichier `madagascar_antananarivo.mbtiles`
3. Style : fond, eau, bâtiments, routes, noms de lieux
4. Aucune connexion internet nécessaire pour la carte web

### Étape 14.2 — Couches affichées
- 🔵 Eau (lacs, rivières)
- 🟢 Parcs et espaces verts
- 🏢 Bâtiments
- 🛣️ Routes mineures, majeures, autoroutes
- 🏷️ Noms de lieux

---

## Résumé des URLs

| Application          | URL                                      |
|---------------------|------------------------------------------|
| Carte (Web)         | http://localhost:5173                     |
| Connexion (Web)     | http://localhost:5173/login               |
| Inscription (Web)   | http://localhost:5173/register            |
| Profil (Web)        | http://localhost:5173/profile             |
| Dashboard (Web)     | http://localhost:5173/manager             |
| Signalements (Web)  | http://localhost:5173/manager/signalements|
| Utilisateurs (Web)  | http://localhost:5173/manager/utilisateurs|
| Statistiques (Web)  | http://localhost:5173/manager/statistiques|
| Application Mobile  | http://localhost:5174                     |
| API Swagger         | http://localhost:8080/swagger-ui.html     |
| TileServer          | http://localhost:8081                     |

---

## Comptes par défaut

| Rôle     | Email               | Mot de passe |
|----------|---------------------|-------------|
| Manager  | manager@cloud.local | manager123  |
