# CLAUDE.md — GLACIORA

Boutique en ligne ski, hockey sur glace et sports de neige. Monorepo npm workspaces.

```
apps/web         Next.js 14 (App Router), TypeScript strict, Tailwind — déployé sur Vercel
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
| E-mails en attente | `npm run emails:process -w @glaciora/api` |
| Purge justificatifs | `npm run proofs:purge -w @glaciora/api` |

## Conventions

- TypeScript strict partout ; validation Zod de **toute** entrée (body, query, params, fichiers).
- API en couches : `routes` → services → Prisma ; erreurs via `AppError` (`src/lib/errors.ts`) et gestionnaire central.
- Montants en **centimes** (`Int`), devise EUR. Jamais de float pour l'argent.
- Couleurs, polices, rayons : uniquement via `apps/web/src/theme/tokens.ts` (Tailwind). Pas de couleur en dur.
- Textes d'interface en français. Composants accessibles : libellés liés, erreurs `aria-describedby`, cibles ≥ 44 px, `prefers-reduced-motion` respecté.
- Données structurées (Product/Offer/BreadcrumbList/Organization) : uniquement des valeurs réelles venant de la base.
- Pas de page « Mentions légales ».

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
