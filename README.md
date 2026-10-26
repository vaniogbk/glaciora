# GLACIORA — boutique ski & hockey sur glace

*Born for ice. Made for adventure.*

Boutique e-commerce complète : catalogue ski / hockey / accessoires, panier, checkout par **virement bancaire SEPA avec QR code et dépôt du justificatif**, comptes clients, backoffice admin. Paiement par carte affiché comme indisponible (aucune simulation).

- Front : Next.js 14 (App Router), TypeScript strict, Tailwind (tokens issus du pack logo), Vercel → `glaciora.vercel.app`
- API : Node.js / Express / TypeScript, Prisma + PostgreSQL, Railway
- E-mails : Brevo (file d'envoi + retries) · Stockage des justificatifs : Cloudflare R2 privé
- Tests : Jest (shared, API sur base réelle, composants web) + Playwright (parcours d'achat en 16 étapes)

## Démarrage rapide (développement)

Prérequis : Node 20+ (testé avec Node 24), Docker.

```bash
npm install
npm run db:up            # PostgreSQL 16 sur localhost:5466 (bases glaciora + glaciora_test)
cp .env.example apps/api/.env   # puis adapter (valeurs de dev) — ou garder le .env généré
npm run db:migrate
npm run db:seed          # catégories, pays, zones ; admin si ADMIN_EMAIL/ADMIN_PASSWORD
npm run import:catalogue # lit GLACIORA_CATALOGUE (jamais modifié) → produits + images WebP
npm run dev              # web http://localhost:3000 · API http://localhost:4000
```

Fichiers d'environnement : `apps/api/.env` (API) et `apps/web/.env.local` (`API_URL`, `NEXT_PUBLIC_SITE_URL`). Liste complète : [.env.example](.env.example).

## Vérifications

```bash
npm run lint
npm run typecheck
npm run test             # shared + API (base glaciora_test remise à zéro) + web
npm run build
npx playwright install chromium && npm run test:e2e
```

## Structure

```
apps/
  api/
    prisma/schema.prisma, migrations/, seed.ts
    data/catalogue-complement.csv      prix marché relevés (avec source), tailles, descriptions
    scripts/                           import-catalogue, seed-e2e, process-emails, purge-proofs
    src/
      config/env.ts                    validation Zod des variables d'environnement
      lib/                             logger (masquage), erreurs, jetons, cookies, journal d'activité
      middlewares/                     sécurité (CSRF, rate limit), auth, erreurs
      modules/
        catalogue/  cart/  checkout/  payments/  auth/  account/
        admin/ (produits, commandes, banque, réglages)  email/  storage/  shipping/
        catalogue-import/  media/  health/
    tests/                             Jest + Supertest (base réelle)
  web/
    src/app/                           pages (boutique, compte, commande, admin)
    src/components/                    UI réutilisable (produit, catalogue, layout, admin)
    src/theme/tokens.ts                design tokens (palette, police, rayons)
packages/shared/                       Zod, panier, livraison, IBAN/QR SEPA, upload, statuts
e2e/                                   Playwright
docs/DEPLOIEMENT.md                    Railway, Vercel, domaine, Brevo, R2, migrations, rollback, checklist
```

## Routes API (préfixe `/api`)

| Domaine | Routes |
|---|---|
| Santé | `GET /health` |
| Catalogue | `GET /catalogue/categories` · `GET /catalogue/products?q&category&sport&size&brand&condition&inStock&minPrice&maxPrice&sort&page` · `GET /catalogue/products/:slug` · `GET /catalogue/home` · `GET /catalogue/sitemap` |
| Panier | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:variantId` · `DELETE /cart/items/:variantId` |
| Checkout | `GET /checkout/config` · `GET /checkout/shipping-quotes?country` · `POST /checkout/payment-details` (IBAN + QR) · `POST /checkout/orders` (multipart `data` + `proof`) · `GET /checkout/orders/:reference` |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/password/forgot` · `POST /auth/password/reset` |
| Compte | `GET/PATCH /account/profile` · `GET/POST /account/addresses` · `PATCH/DELETE /account/addresses/:id` · `GET /account/orders` · `GET /account/orders/:reference` |
| Admin | `GET /admin/dashboard` · produits (`/admin/products`, variantes, stock, images) · commandes (`/admin/orders`, statut, suivi, justificatifs, refus) · `/admin/bank-accounts` · catégories · tailles · clients · livraison (zones, tarifs, pays) · `/admin/activity` · `/admin/emails` · `/admin/import` |
| Médias | `GET /media/products/:file` (images ajoutées depuis l'admin) |

Toute écriture exige l'en-tête `x-glaciora-csrf: 1` et une origine autorisée.

## Fonctionnement du paiement par virement

1. Le client choisit son pays et son mode de livraison.
2. « Afficher les coordonnées bancaires » : l'API calcule le montant définitif, réserve une **référence signée** liée à ce montant (3 h) et renvoie le compte du **pays de livraison** (Admin → Coordonnées bancaires), sinon le compte principal (`BANK_*`), avec un **QR code SEPA EPC069-12**.
3. Le client dépose sa confirmation (PDF/JPG/PNG/WEBP, 10 Mo, type vérifié par signature).
4. La commande est créée en transaction : stock décrémenté sans survente, statut « en attente de vérification du paiement », justificatif stocké en privé, e-mails mis en file (boutique : référence, nom, montant, pays, lien admin sécurisé — sans pièce jointe ni IBAN ; client : récapitulatif).
5. L'admin consulte le justificatif puis marque la commande payée.

## Catalogue

- Source : `GLACIORA_CATALOGUE/04_SUIVI_PRODUITS/suivi_produits.csv` + images `01_SKI` / `02_HOCKEY` (`03_CATALOGUE_COMPLET` = copies, ignoré).
- `apps/api/data/catalogue-complement.csv` : **prix du marché relevés le 26/10/2026** (prix le plus bas trouvé chez un revendeur européen en euros, URL source par produit), tailles usuelles par type d'article, descriptions factuelles.
- Import idempotent (empreinte par produit), rapport dans `apps/api/import-reports/`, historique dans Admin → Import.
- Statut à l'import : publié si « terminé » dans le suivi **et** prix trouvé ; sinon brouillon. Le stock n'est jamais écrasé par un ré-import.
- Visuels générés par IA : mention « Visuel d'illustration non contractuel » sur les fiches.
- Images d'ambiance de l'accueil : déposer les fichiers dans `GLACIORA_CATALOGUE/05_ACCUEIL` (voir « À compléter »).

## Déploiement

Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) : variables Railway/Vercel, migrations, domaine, Brevo, R2, rollback, checklist.

## À compléter manuellement

Voir la section correspondante de [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md#8-checklist-de-mise-en-production) et le rapport d'import.
