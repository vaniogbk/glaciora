# CLAUDE.md — GLACIORA

Boutique en ligne ski, hockey sur glace et sports de neige. Monorepo npm workspaces.

```
apps/web         Next.js 15 (App Router, React 19), TypeScript strict, Tailwind — déployé sur Vercel (région fra1)
apps/api         Express + Prisma (PostgreSQL) — déployé sur Railway
packages/shared  Logique partagée et testée : schémas Zod, panier, livraison, QR SEPA, upload, statuts
e2e/             Playwright (parcours d'achat complet)
GLACIORA_CATALOGUE/, Identité graphique/   Sources client : lecture seule, jamais modifiées, non versionnées
```

## Commandes

| Besoin | Commande |
|---|---|
| Installer | `npm install` (build `shared` + `prisma generate` en postinstall) |
| Base locale | `npm run db:up` (Docker, port **5466**, bases `glaciora` et `glaciora_test`) |
| Migrations (dev) | `npm run db:migrate` — crée et applique une migration |
| Migrations (prod) | `npm run db:deploy` |
| Seed | `npm run db:seed` (catégories, pays/zones, admin initial si `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |
| Import catalogue | `npm run import:catalogue` (`-- --dry-run` pour simuler) |
| Développement | `npm run dev` (API :4000, web :3000, `/api` proxifié par Next) |
| Lint / types | `npm run lint` · `npm run typecheck` |
| Tests unitaires | `npm run test` (API sur la base `glaciora_test`, remise à zéro automatique) |
| Build | `npm run build` |
| E2E | `npx playwright install chromium` puis `npm run build && npm run test:e2e` |
| Vitesse mobile lente | `npm run test:perf` (site en ligne, ou `PERF_BASE_URL=…`) |
| E-mails en attente | `npm run emails:process -w @glaciora/api` |
| Purge justificatifs | automatique (worker de maintenance) ; à la main : `npm run proofs:purge -w @glaciora/api` |

## Conventions

- TypeScript strict partout ; validation Zod de **toute** entrée (body, query, params, fichiers).
- API en couches : `routes` → services → Prisma ; erreurs via `AppError` (`src/lib/errors.ts`) et gestionnaire central.
- Montants en **centimes** (`Int`), devise EUR. Jamais de float pour l'argent.
- Couleurs, polices, rayons : uniquement via `apps/web/src/theme/tokens.ts` (Tailwind). Pas de couleur en dur.
- Textes d'interface en français. Composants accessibles : libellés liés, erreurs `aria-describedby`, cibles ≥ 44 px, `prefers-reduced-motion` respecté.
- Données structurées (Product/Offer/BreadcrumbList/Organization) : uniquement des valeurs réelles venant de la base.
- Pas de page « Mentions légales ».
- Next 15 : `params` et `searchParams` sont des promesses dans les pages serveur ; dans les pages client, lire l'identifiant avec `useParams()`.
- Fiches produit en ISR (`generateStaticParams` vide + `revalidate`), **sans `loading.tsx`** : la page mise en cache doit contenir le produit directement (un squelette oblige le téléphone à l'afficher puis à le remplacer, ce qui retarde le LCP). Catalogue : squelette dans un `<Suspense>` de page (`CatalogueBodySkeleton`), jamais de `loading.tsx` au niveau du groupe `app/(listings)` (casse la navigation des filtres sous Next 15).
- **Langues** : la boutique est traduite en 17 langues (`app/[locale]`, middleware de détection, `src/i18n`). Aucun texte en dur dans les pages publiques : ajouter la clé dans `i18n/messages/fr.ts` **et** dans les 16 autres langues (le test `i18n.test.ts` échoue sinon). Liens internes avec `Link` de `@/i18n/client` (ajoute le préfixe de langue). Contenu du catalogue traduit par slug dans `i18n/catalogue/<langue>.ts`. L'admin reste en français (`app/admin/layout.tsx`, racine à part).
- Accueil : sections sous la ligne de flottaison en `cv-auto` (`content-visibility: auto`) pour alléger le premier affichage mobile. Vitesse du build local : `PERF_LOCAL=1 npm run test:perf`.
- Commandes : statut `PREPARING` dès le dépôt de la preuve, puis `SHIPPED` (« En route ») et `DELIVERED` ; messages de suivi dans `TRACKING_STEPS` (shared).

## Règles de sécurité (non négociables)

- Aucun secret dans le dépôt : `.env*` ignorés, seul `.env.example` (sans valeurs) est versionné.
- Aucun IBAN réel dans le code. IBAN = variables d'environnement (`BANK_*`) ou table `BankAccount` (admin). Les IBAN d'exemple sont refusés hors dev/test.
- Toute modification de coordonnées bancaires est journalisée (IBAN masqué) et notifiée à `ORDER_NOTIFICATION_EMAIL`.
- Justificatifs de virement : stockage privé (`local` hors `public/`, ou R2 privé), lecture uniquement via `GET /api/admin/orders/:id/proofs/:proofId` (admin). Type réel vérifié par signature, nom de fichier aléatoire.
- Auth : JWT d'accès 15 min + refresh token rotatif (empreinte en base, détection de réutilisation), cookies `httpOnly`/`Secure`/`SameSite`. Argon2id. Verrouillage après 5 échecs. Réponses identiques (pas d'énumération).
- Routes admin : `requireAuth` + `requireAdmin` qui revérifie le rôle **en base** à chaque requête.
- CSRF : en-tête `x-glaciora-csrf: 1` obligatoire + contrôle `Origin` sur toute écriture.
- Journaux : jamais de cookie, jeton, mot de passe, e-mail, IBAN ni corps de requête.
- Paiement carte : indisponible, **ne jamais simuler** un paiement réussi. Point d'extension : `CardPaymentProvider`.
- E-mails : statut `SENT` uniquement après accusé du fournisseur (Brevo `messageId`). Mode `console` = `LOGGED`.
- Ne pas inventer de produits, prix, stocks ou images. Prix initiaux = relevés marché sourcés (`apps/api/data/catalogue-complement.csv`).

## Variables d'environnement

Liste complète et commentée : `.env.example`. Développement : `apps/api/.env` et `apps/web/.env.local`.
