# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This repo currently contains only the initial Next.js + shadcn/ui scaffold. None of the application described below (auth, database, OCR, forms) is implemented yet — `app/page.tsx` is still the default starter page. **`project-ocr.md` is the full technical specification** for what needs to be built; read it in full before implementing any feature. Everything in the "Product: Tractage Pigier Bénin" section below is a summary of that spec, not a description of existing code.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`).

- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint (flat config, `eslint-config-next`)
- `pnpm format` — Prettier write (`.ts`/`.tsx`, with `prettier-plugin-tailwindcss` for class sorting)
- `pnpm typecheck` — `tsc --noEmit`

There is no test runner configured yet.

To add a shadcn/ui component:

```bash
npx shadcn@latest add <component>
```

This places generated components under `components/ui/`. Import app code via the `@/*` path alias (maps to repo root), e.g. `@/components/ui/button`, `@/lib/utils`, `@/hooks/...`.

## Important environment note

`AGENTS.md` flags that the installed Next.js version (16.2.6) may differ from training-data conventions. Before writing Next.js code (routing, data fetching, route handlers, etc.), check `node_modules/next/dist/docs/` for the relevant guide rather than assuming older Next.js patterns apply.

## Conventions already established in the scaffold

- No semicolons, double quotes, 2-space indent, print width 80 (see `.prettierrc`) — always run through Prettier rather than hand-matching style.
- Tailwind v4 with CSS variables; shadcn config (`components.json`) uses style `base-lyra`, base color `neutral`, no class prefix, Lucide icons.
- `ThemeProvider` (`components/theme-provider.tsx`) wraps the app in `app/layout.tsx`, supports light/dark/system via `next-themes`, and binds a global `d` hotkey to toggle dark mode (ignored while typing in an input/textarea/select/contentEditable).
- `cn()` in `lib/utils.ts` (clsx + tailwind-merge) is the standard helper for conditional class names — used by shadcn components and expected everywhere else.

## Product: Tractage Pigier Bénin

Pigier Bénin runs door-to-door outreach campaigns (*tractage*) at schools to collect prospect contacts. Today this is done on handwritten paper sheets, then manually re-entered into Excel. The system being built digitizes this in two ways:

1. **OCR path**: upload a photo/PDF of a handwritten sheet → Mistral OCR (`mistral-ocr-4-0`) extracts structured rows → low-confidence values are highlighted for human review → export to Excel.
2. **Tablet path**: direct digital entry via a dynamic form on a tablet, for future campaigns (no more paper).

### Core architectural principle — read this before touching templates/fields

A single **template** defines an ordered list of **fields** (key, label, type, required, options). That one template drives **three** things simultaneously:
- the JSON schema sent to Mistral for OCR,
- the dynamic tablet form,
- the Excel export headers.

Editing the template's fields (adding/renaming/deactivating a column) must update all three automatically — there must never be a hardcoded field/column list anywhere in the app. This is the mechanism that lets the org add a form column (e.g. "Class", "Email") without a DB migration or code rewrite. See `project-ocr.md` §1 and §9 (`buildOcrSchema`) for the intended implementation pattern.

### Data model (4 business tables + Better Auth tables)

- `template` — a tractage template (`nom`, `annee`, `actif`; one active template recommended).
- `field` — a template's fields. `key` is an immutable slug (JSON key + export header); `label`, `type` (`text`/`tel`/`email`/`number`/`date`/`select`), `requis`, `options` (for `select`), `ordre`, `actif`. Unique on `(template_id, key)`. Deactivate rather than delete, to preserve historical data.
- `session` — one filled sheet, scoped to `etablissement` + `date_tractage`, fixes `template_id` at creation, `source` (`ocr`/`tablette`), `statut` (`en_cours` → `valide` → `exporte`).
- `entry` — one row/person within a session: `valeurs` (JSONB, keyed by `field.key`), `confiance` (JSONB of OCR scores per field, null for tablet entries), `statut` (`a_verifier`/`valide`).

`entry.valeurs` and `entry.confiance` are JSONB precisely so new fields never require a migration — this is the central flexibility mechanism (see `project-ocr.md` §4.4). `entry.valeurs` references fields by `field.key`, not by FK.

Soft delete (`deleted_at`) for `template` and `session` — never hard delete. Fields are deactivated (`actif = false`), never deleted, to preserve values already stored in `entry.valeurs`.

### Key business rules (see `project-ocr.md` §6 for the full numbered list, RG-01..RG-16)

- `field.key`: lowercase slug, no spaces/accents, immutable once created.
- Session status only moves `en_cours → valide → exporte`; a session can only become `valide` once every one of its entries is `valide`.
- Phone (`tel`) is always stored as **text**, normalized to Beninese format `^01[0-9]{8}$`, never as a number (preserves the leading `0`).
- OCR-derived values with confidence `< 0.75` (configurable threshold) are visually flagged and keep the entry at `a_verifier` until a human confirms/corrects it; a manual correction implicitly promotes that value to human-validated.
- Tablet-entered data must pass required/type validation before the entry is saved as `valide`; OCR-entered data may be saved incomplete/invalid and is queued for review instead.

### Planned stack (per `project-ocr.md` §3) — not yet installed

Next.js App Router (route handlers for the API) + shadcn/ui/Tailwind + **Better Auth** (roles: `admin`, `agent`, Prisma adapter) + **PostgreSQL** with JSONB + **Prisma ORM** + **Mistral OCR** (`@mistralai/mistralai`, model `mistral-ocr-4-0`) + **exceljs** for `.xlsx` export + S3/Cloudflare R2 for file storage (signed URLs, never base64 large PDFs, never store files in the DB).

Every Route Handler must check both the Better Auth session and the caller's role (`admin` for template/field management, `agent` for sessions/entries/OCR/export) before acting.

### Build order (per `project-ocr.md` §11)

Setup (Next.js/Tailwind/shadcn/Prisma/Postgres) → Auth (Better Auth, roles, login) → data model + migrations + seed (a "Tractage 2026" template with `nom_prenom` and `telephone` fields) → template/field admin CRUD → sessions CRUD → dynamic tablet form → dynamic Excel export → OCR upload/schema/entry creation → OCR review UI (highlighted low-confidence cells) → status/soft-delete polish. Each step should be testable before starting the next.
