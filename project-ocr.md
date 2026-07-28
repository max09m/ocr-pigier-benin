# Tractage Pigier Bénin — Spécification technique

> Document de référence pour l'implémentation du projet avec Claude Code.
> Il contient le contexte, la stack, le modèle de données, les relations, les règles de gestion, les flux et l'ordre de construction. À lire en entier avant de coder.

---

## 1. Contexte et objectif

Pigier Bénin organise des campagnes de **tractage** (collecte de contacts de prospects) dans des établissements scolaires. Aujourd'hui, les données sont collectées sur des **feuilles papier manuscrites** (une feuille par établissement et par date), puis ressaisies à la main dans Excel.

Le projet a trois objectifs :

1. **Numériser les feuilles manuscrites** via OCR (Mistral OCR 4), avec vérification humaine des valeurs incertaines, puis export Excel.
2. **Permettre la saisie numérique directe** sur tablette via un formulaire, pour les futures campagnes (plus de papier).
3. **Rester flexible** : pouvoir ajouter une colonne au formulaire (ex. « Classe », « Email ») **sans migration de base ni refonte du code**.

### Principe architectural central

Un **template de tractage** définit la liste des champs. Ce template unique pilote **trois** comportements :

- le **schéma JSON** envoyé à Mistral pour l'OCR,
- le **formulaire dynamique** affiché sur la tablette,
- les **en-têtes** du fichier Excel exporté.

Une modification du template met à jour les trois automatiquement. C'est la clé pour absorber les colonnes futures sans douleur.

---

## 2. Périmètre du MVP

Inclus :

- Authentification (Better Auth) avec deux rôles : `admin` et `agent`.
- Gestion des templates de tractage et de leurs champs (admin).
- Création de sessions de tractage (établissement + date).
- Voie 1 : upload d'une photo/PDF manuscrit → OCR → entrées structurées → vérification → validation.
- Voie 2 : saisie numérique sur tablette via formulaire dynamique.
- Vérification des cellules à faible confiance (issues de l'OCR).
- Export Excel (.xlsx) d'une session.

Hors périmètre pour le MVP (à noter pour plus tard) :

- Gestion multi-organisation (on suppose une seule organisation : Pigier Bénin).
- Statistiques/tableaux de bord analytiques.
- Application mobile native (la tablette utilise le web responsive).
- Déduplication automatique inter-sessions.

---

## 3. Stack technique

| Élément | Choix | Notes |
|---|---|---|
| Framework | **Next.js** (App Router) | Route Handlers pour l'API |
| UI | **shadcn/ui** + Tailwind | Composants du formulaire et des tableaux |
| Auth | **Better Auth** | Sessions + rôles ; adaptateur Prisma |
| Base de données | **PostgreSQL** | Colonnes **JSONB** pour les valeurs dynamiques |
| ORM | **Prisma ORM** | |
| OCR | **Mistral OCR 4** | Modèle API : `mistral-ocr-4-0` |
| Export Excel | **exceljs** | `xlsx` (SheetJS) possible en alternative |
| Stockage fichiers | **S3 / Cloudflare R2** | URLs signées passées à Mistral |
| SDK Mistral | `@mistralai/mistralai` | Vérifier la signature exacte dans les cookbooks Mistral |

### Variables d'environnement

```
DATABASE_URL=postgres://...
MISTRAL_API_KEY=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

---

## 4. Modèle de données

Quatre tables métier, plus les tables gérées par Better Auth (`user`, `session` d'auth, `account`, `verification` — générées par la librairie, non détaillées ici sauf le champ `role` ajouté à `user`).

> Convention : toutes les tables ont `id` (UUID, PK), `created_at`, `updated_at` (timestamptz) et, quand pertinent, `deleted_at` (soft delete) et `created_by` (FK vers `user.id`).

### 4.1 Table `template`

Définit un modèle de feuille de tractage.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | |
| `nom` | text | NOT NULL | Ex. « Tractage 2026 » |
| `annee` | integer | NOT NULL | Ex. 2026 |
| `actif` | boolean | NOT NULL, default true | Un seul template actif à la fois (recommandé) |
| `created_by` | uuid | FK → user.id | |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |
| `deleted_at` | timestamptz | NULL | Soft delete |

### 4.2 Table `field` (définition de champ)

Les colonnes du formulaire. **C'est ici qu'on ajoute une colonne future.**

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | |
| `template_id` | uuid | FK → template.id, NOT NULL | |
| `key` | text | NOT NULL | Slug stable, ex. `nom_prenom`, `telephone`. Sert de clé JSON et d'en-tête technique. **Immuable** une fois créé. |
| `label` | text | NOT NULL | Libellé affiché, ex. « Nom & Prénom » |
| `type` | text | NOT NULL | Enum : `text`, `tel`, `email`, `number`, `date`, `select` |
| `requis` | boolean | NOT NULL, default false | Champ obligatoire en saisie tablette |
| `options` | jsonb | NULL | Liste de valeurs si `type = select` |
| `ordre` | integer | NOT NULL | Ordre d'affichage / des colonnes |
| `actif` | boolean | NOT NULL, default true | Désactivation sans suppression (préserve les données existantes) |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

Contrainte d'unicité : `(template_id, key)` unique.

### 4.3 Table `session` (feuille de tractage)

Une feuille remplie, pour un établissement et une date. (Nom métier « session de tractage » — à ne pas confondre avec la session d'authentification de Better Auth.)

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | |
| `template_id` | uuid | FK → template.id, NOT NULL | Fige la structure des champs utilisée |
| `etablissement` | text | NOT NULL | Ex. « CEG Lé Hokoué » |
| `date_tractage` | date | NOT NULL | Ex. 2026-07-20 |
| `source` | text | NOT NULL | Enum : `ocr`, `tablette` |
| `statut` | text | NOT NULL, default `en_cours` | Enum : `en_cours`, `valide`, `exporte` |
| `fichier_url` | text | NULL | URL du scan si `source = ocr` |
| `created_by` | uuid | FK → user.id | Agent qui a créé la session |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |
| `deleted_at` | timestamptz | NULL | Soft delete |

### 4.4 Table `entry` (ligne / personne)

Une ligne de la feuille (un prospect).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK | |
| `session_id` | uuid | FK → session.id, NOT NULL | |
| `ligne` | integer | NOT NULL | Numéro de ligne (le « N° » de la feuille) |
| `valeurs` | jsonb | NOT NULL, default '{}' | Clés = `field.key`, ex. `{"nom_prenom":"ADANGBOZIN Charles","telephone":"0161105955"}` |
| `confiance` | jsonb | NULL | Scores OCR par champ, ex. `{"nom_prenom":0.98,"telephone":0.62}`. NULL si saisie tablette. |
| `statut` | text | NOT NULL, default `a_verifier` | Enum : `a_verifier`, `valide` |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

> **Pourquoi `valeurs` en JSONB** : ajouter un champ ne nécessite **aucune migration**. Les entrées existantes n'ont simplement pas la nouvelle clé (traitée comme vide). C'est le mécanisme central de flexibilité.

---

## 5. Relations

```
user (1) ──< (N) template          un admin crée des templates
template (1) ──< (N) field         un template a plusieurs champs
template (1) ──< (N) session       un template sert à plusieurs feuilles
user (1) ──< (N) session           un agent crée des sessions
session (1) ──< (N) entry          une feuille a plusieurs lignes
```

- Suppression d'un `template` ou d'une `session` : **soft delete** (`deleted_at`), jamais de suppression physique (audit + intégrité).
- Suppression d'un `field` : passer `actif = false`, **ne pas** supprimer, pour préserver les valeurs déjà saisies dans les entrées.
- `entry.valeurs` référence les champs par `field.key` (et non par FK), pour rester souple ; l'intégrité champ↔valeur est gérée au niveau applicatif.

---

## 6. Règles de gestion

### 6.1 Templates et champs

- **RG-01** : Un `field.key` est un slug en minuscules, sans espace ni accent (ex. `nom_prenom`). Il est **immuable** après création (le `label` peut changer, pas la `key`).
- **RG-02** : Ajouter un champ = créer une ligne `field` avec un `ordre` cohérent. Aucun impact sur les données existantes.
- **RG-03** : Désactiver un champ (`actif = false`) le retire des nouveaux formulaires, schémas OCR et exports, sans effacer les valeurs historiques.
- **RG-04** : Un seul template `actif = true` recommandé, pour éviter l'ambiguïté à la création de session.

### 6.2 Sessions

- **RG-05** : `etablissement` et `date_tractage` sont obligatoires à la création.
- **RG-06** : Une session fige le `template_id` : la structure des champs utilisée est celle du template au moment de la création (les champs sont lus dynamiquement mais restent cohérents pour l'export).
- **RG-07** : Transitions de statut autorisées : `en_cours → valide → exporte`. Une session ne peut passer à `valide` que si **toutes ses entrées** sont au statut `valide`.

### 6.3 Entrées et validation des valeurs

- **RG-08** : Validation par type de champ :
  - `tel` : stocké en **texte**, normalisé au format béninois — 10 chiffres commençant par `01` (ex. `0161105955`). Nettoyer espaces/tirets/points avant stockage. Regex indicative : `^01[0-9]{8}$`.
  - `email` : format email standard.
  - `number` : numérique.
  - `date` : date valide (ISO).
  - `select` : valeur ∈ `field.options`.
  - `text` : non vide si `requis`.
- **RG-09** : En **saisie tablette**, tous les champs `requis` doivent être remplis et valides avant enregistrement de l'entrée.
- **RG-10** : En **saisie OCR**, une entrée peut être incomplète ou invalide ; elle est alors marquée `a_verifier` et présentée à l'agent pour correction.
- **RG-11** : Une entrée passe à `valide` uniquement quand tous ses champs requis sont remplis, valides, et (si issue de l'OCR) revus par un humain.

### 6.4 Confiance OCR

- **RG-12** : Pour chaque champ extrait, l'OCR renvoie un score de confiance stocké dans `entry.confiance`.
- **RG-13** : Toute valeur avec un score **< 0.75** (seuil configurable) est signalée visuellement (cellule surlignée) et l'entrée reste `a_verifier` tant qu'un humain n'a pas confirmé/corrigé.
- **RG-14** : Une correction manuelle d'une valeur remonte implicitement sa confiance à « validée par humain » (l'agent en est responsable).

### 6.5 Téléphone (spécifique)

- **RG-15** : Toujours stocker le téléphone en **texte** (jamais en nombre) pour préserver le `0` initial.
- **RG-16** : Optionnel — signaler (sans bloquer) si le même numéro apparaît deux fois dans la même session.

---

## 7. Flux applicatifs

### 7.1 Voie OCR (feuille manuscrite → Excel)

1. L'agent crée une session (`source = ocr`) en renseignant établissement + date.
2. Il uploade la photo/PDF de la feuille ; le fichier part vers le stockage (S3/R2), on récupère une **URL signée**.
3. Le backend construit dynamiquement le **schéma JSON** à partir des `field` actifs du template, puis appelle `mistral-ocr-4-0` avec le document + le schéma.
4. La réponse (tableau d'objets structurés + scores) est parsée : une `entry` est créée par ligne, avec `valeurs` et `confiance`.
5. L'interface affiche les entrées dans un tableau, **cellules à faible confiance surlignées** (RG-13).
6. L'agent corrige et valide chaque entrée, puis valide la session (RG-07).
7. Export Excel disponible.

### 7.2 Voie tablette (saisie numérique)

1. L'agent crée une session (`source = tablette`) : établissement + date.
2. L'app rend un **formulaire dynamique** à partir des `field` actifs (un contrôle shadcn par champ selon son `type`).
3. L'agent saisit les entrées (ligne par ligne, ou grille). Validation selon RG-08/RG-09.
4. Chaque entrée valide est enregistrée en `valide`.
5. Validation de session, puis export.

### 7.3 Export Excel

1. L'agent choisit une session.
2. Le backend génère un classeur `.xlsx` :
   - En-têtes = `label` des `field` actifs, dans l'ordre `ordre`, précédés d'une colonne « N° » (`entry.ligne`).
   - Lignes = `entry.valeurs` mappées par `field.key`.
   - En-tête de feuille (ou métadonnées) : établissement + date.
3. Passage du statut de session à `exporte`.
4. Téléchargement du fichier.

---

## 8. Endpoints API (Next.js Route Handlers)

Tous protégés par Better Auth. Les routes de gestion de template exigent le rôle `admin`.

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/templates` | admin | Créer un template |
| GET | `/api/templates` | agent | Lister les templates |
| GET | `/api/templates/:id` | agent | Détail + champs |
| PATCH | `/api/templates/:id` | admin | Modifier |
| POST | `/api/templates/:id/fields` | admin | Ajouter un champ |
| PATCH | `/api/fields/:id` | admin | Modifier/désactiver un champ |
| POST | `/api/sessions` | agent | Créer une session |
| GET | `/api/sessions` | agent | Lister les sessions |
| GET | `/api/sessions/:id` | agent | Détail + entrées |
| PATCH | `/api/sessions/:id` | agent | Changer statut (ex. valider) |
| POST | `/api/sessions/:id/entries` | agent | Ajouter une entrée (tablette) |
| PATCH | `/api/entries/:id` | agent | Corriger/valider une entrée |
| POST | `/api/ocr` | agent | Upload + OCR → entrées |
| GET | `/api/sessions/:id/export` | agent | Générer et télécharger le .xlsx |

---

## 9. Génération dynamique du schéma OCR

Le schéma envoyé à Mistral est **construit à partir des champs** — jamais codé en dur. Pseudo-code :

```ts
function buildOcrSchema(fields: Field[]) {
  const properties: Record<string, any> = {};
  for (const f of fields.filter(f => f.actif)) {
    properties[f.key] = {
      type: f.type === "number" ? "number" : "string",
      description: f.label,
    };
  }
  return {
    type: "object",
    properties: {
      lignes: {
        type: "array",
        items: { type: "object", properties },
      },
    },
  };
}
```

Appel OCR (à adapter à la signature exacte du SDK `@mistralai/mistralai`, à vérifier dans les cookbooks Mistral) :

```ts
const result = await client.ocr.process({
  model: "mistral-ocr-4-0",
  document: { type: "document_url", documentUrl },
  documentAnnotationFormat: {
    type: "json_schema",
    jsonSchema: { name: "tractage", schema: buildOcrSchema(fields) },
  },
});
```

Le même tableau `fields` sert aussi à générer le formulaire tablette et les en-têtes Excel : **une seule source de vérité**.

---

## 10. Sécurité et rôles

- Authentification par Better Auth (sessions serveur).
- Champ `role` sur `user` : `admin` ou `agent`.
- `admin` : gère templates et champs, accès à tout.
- `agent` : crée des sessions, saisit/corrige des entrées, exporte.
- Chaque Route Handler vérifie la session **et** le rôle avant toute action.
- Les fichiers uploadés ne transitent pas en base : stockage objet + URL signée à durée limitée.

---

## 11. Ordre de construction recommandé (pour Claude Code)

Construire dans cet ordre, chaque étape testable avant la suivante :

1. **Setup projet** : Next.js (App Router) + Tailwind + shadcn/ui + Prisma + Postgres.
2. **Auth** : Better Auth (adaptateur Prisma), rôles `admin`/`agent`, pages login.
3. **Modèle de données** : schéma Prisma des 4 tables + migrations. Seed d'un template « Tractage 2026 » avec champs `nom_prenom` (text, requis) et `telephone` (tel, requis).
4. **Gestion des templates/champs** : CRUD admin + UI minimale.
5. **Sessions** : création (établissement + date), liste, détail.
6. **Formulaire tablette dynamique** : rendu des champs depuis `field`, validation RG-08/09, ajout d'entrées.
7. **Export Excel dynamique** : en-têtes depuis `field`, lignes depuis `entry.valeurs`.
8. **OCR** : upload fichier + stockage + URL signée ; `buildOcrSchema` ; appel `mistral-ocr-4-0` ; création des entrées avec confiance.
9. **Vérification OCR** : tableau avec cellules surlignées (< seuil), correction, validation.
10. **Finitions** : statuts de session, soft delete, garde-fous des règles de gestion.

---

## 12. Points d'attention

- **Téléphone en texte**, toujours (RG-15). Normaliser avant stockage.
- **Manuscrit** : même avec OCR 4, prévoir la vérification humaine ; les scores de confiance sont le mécanisme central (RG-12/13).
- **Coût OCR** : facturation à la page. Pour de gros volumes, envisager la Batch API de Mistral.
- **Upload** : préférer S3/R2 + URL signée au base64 pour les PDF volumineux.
- **Ajout de colonne** : ne jamais coder les colonnes en dur ; tout passe par la table `field` (RG-02).
- **Vérifier la signature exacte du SDK Mistral** dans les cookbooks officiels, car les noms de paramètres peuvent évoluer selon la version du package.

---

*Fin de la spécification. Toute décision d'implémentation doit rester cohérente avec le principe de la section 1 : le template comme source unique de vérité.*