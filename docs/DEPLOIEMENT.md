# Déploiement GLACIORA

État au 26/10/2026 : dépôt public `vaniogbk/glaciora` ; Railway projet `glaciora` (service `api` → `https://api-production-70d8.up.railway.app`, PostgreSQL) ; Vercel projet `glaciora` (racine `apps/web`, déploiement automatique à chaque push sur `main`), adresse **`https://glaciora-chi.vercel.app`** : `glaciora.vercel.app` appartient déjà à un autre compte Vercel. Si l'adresse change (domaine personnalisé), mettre à jour `WEB_ORIGIN` et `PUBLIC_SITE_URL` (Railway) et `NEXT_PUBLIC_SITE_URL` (Vercel), sinon l'API refuse les ajouts au panier et les commandes (contrôle d'origine).

Architecture : **Vercel** (site Next.js, `glaciora-chi.vercel.app`) → proxy `/api/*` → **Railway** (API Express + PostgreSQL).
Le navigateur ne parle qu'au domaine du site : cookies first-party, aucune configuration CORS.

## 1. Backend sur Railway

1. Créer un projet Railway, ajouter **PostgreSQL** puis un service **depuis le dépôt GitHub** (racine du dépôt).
2. `railway.json` (racine, builder Railpack) configure : démarrage `npm start` qui applique d'abord les migrations (`prisma migrate deploy`) puis lance l'API, healthcheck `/api/health`. Variable de service `RAILPACK_BUILD_CMD="npm run build -w @glaciora/shared && npm run build -w @glaciora/api"` pour ne pas construire le site sur Railway.
3. Variables du service API (onglet *Variables*) — voir `.env.example` :
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `NODE_ENV=production`, `APP_ENV=production` (ou `staging` pour la préproduction), `TRUST_PROXY=2`, `COOKIE_SECURE=true`
   - `WEB_ORIGIN=https://glaciora-chi.vercel.app`, `PUBLIC_SITE_URL=https://glaciora-chi.vercel.app`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (aléatoires, différents, ≥ 32 caractères)
   - `BANK_ACCOUNT_HOLDER`, `BANK_IBAN`, `BANK_BIC`, `BANK_NAME` (compte principal)
   - E-mail (§4) et stockage (§5)
4. Générer un domaine public Railway (*Settings → Networking*) : c'est l'`API_URL` à donner à Vercel.
5. Premier déploiement : créer l'admin **une seule fois** depuis votre poste :
   ```bash
   DATABASE_URL="<url publique Railway>" ADMIN_EMAIL="vous@exemple.fr" ADMIN_PASSWORD="<mot de passe fort>" npm run db:seed
   ```
   (le mot de passe ne transite que dans votre terminal ; ne le mettez pas dans les variables Railway).
6. Catalogue en production (la base Railway n'est pas exposée publiquement) : exporter l'instantané en local (`npm run catalogue:snapshot -w @glaciora/api`), committer `apps/api/data/catalogue-snapshot.json`, déployer, puis dans le conteneur :
   ```bash
   railway ssh --service api -- "cd /app/apps/api && npx tsx scripts/import-catalogue-snapshot.ts && npx tsx scripts/set-min-stock.ts 30 && npx tsx scripts/apply-shipping-rates.ts"
   ```
   Alternative si la base est joignable depuis votre poste — importer depuis le dossier `GLACIORA_CATALOGUE` :
   ```bash
   DATABASE_URL="<url publique Railway>" npm run import:catalogue
   ```
   Les images optimisées sont écrites dans `apps/web/public/media/products` : les committer puis redéployer Vercel.

## 2. Frontend sur Vercel

1. *Add New Project* → dépôt GitHub → **Root Directory : `apps/web`** → nom du projet **`glaciora`** (Vercel attribue `glaciora-chi.vercel.app`, `glaciora.vercel.app` étant pris).
2. `apps/web/vercel.json` gère l'installation (racine du monorepo) et le build.
3. Variables : `API_URL=https://<api>.up.railway.app`, `NEXT_PUBLIC_SITE_URL=https://glaciora-chi.vercel.app` (Production) ; mêmes clés avec les URL de préproduction pour *Preview*.
4. Le proxy `/api/*` est défini dans `next.config.mjs` (évalué au build : redéployer après tout changement d'`API_URL`).

### Environnements

| | Développement | Préproduction | Production |
|---|---|---|---|
| Web | `localhost:3000` | Vercel *Preview* | `glaciora-chi.vercel.app` |
| API | `localhost:4000` | service Railway `staging` (`APP_ENV=staging`) | service Railway `production` |
| Base | Docker `:5466` | Postgres Railway dédié | Postgres Railway dédié |
| E-mail | `console` | Brevo (adresse de test) | Brevo |
| Stockage | `local` | bucket R2 `glaciora-staging` | bucket R2 `glaciora-prod` |

## 3. Domaine personnalisé (plus tard)

1. Vercel → *Settings → Domains* → ajouter `www.votre-domaine.fr` et suivre les enregistrements DNS (CNAME `cname.vercel-dns.com`, A `76.76.21.21` pour l'apex).
2. Mettre à jour `NEXT_PUBLIC_SITE_URL` (Vercel) et `WEB_ORIGIN` / `PUBLIC_SITE_URL` (Railway), puis redéployer les deux.
3. L'API reste sur son domaine Railway (appelée uniquement par le proxy Vercel).

## 4. E-mail transactionnel (Brevo)

1. Brevo → *Senders, Domains & Dedicated IPs* : valider l'adresse ou le domaine expéditeur (SPF, DKIM, DMARC).
2. *SMTP & API → API Keys* : créer une clé. **Ne la collez jamais dans un chat ni dans le dépôt** : saisissez-la directement dans Railway (`BREVO_API_KEY`).
3. Railway : `EMAIL_PROVIDER=brevo`, `EMAIL_FROM=<expéditeur validé>`, `EMAIL_FROM_NAME=GLACIORA`, `ORDER_NOTIFICATION_EMAIL=glacioara@outlook.fr`.
4. Vérifier : passer une commande test, puis Admin → *Journaux & e-mails* : statut `SENT` (accusé Brevo). En cas d'échec, nouvelles tentatives automatiques (1, 5, 15, 60, 360 min), bouton *Renvoyer*.

## 5. Stockage des justificatifs (Cloudflare R2)

1. Cloudflare → R2 → créer un bucket **privé** `glaciora-prod` (aucun accès public, aucun domaine public).
2. *Manage R2 API Tokens* → token **Object Read & Write limité à ce bucket**.
3. Railway : `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
4. Conservation : `PROOF_RETENTION_DAYS` (400 par défaut). Planifier `npm run proofs:purge -w @glaciora/api` (Railway *Cron*, quotidien). Optionnel : règle de cycle de vie R2 en filet de sécurité.

## 6. Migrations en production

- Automatiques à chaque démarrage de l'API sur Railway (`npm start` → `prisma migrate deploy`) : si une migration échoue, le nouveau conteneur ne démarre pas, le healthcheck échoue et l'ancienne version continue de tourner.
- Manuelles : `DATABASE_URL="<url>" npm run db:deploy`.
- Règle : migrations **additives** (nouvelles colonnes nullables, nouvelles tables) ; suppression de colonnes en deux temps (code qui ne l'utilise plus, puis migration).

## 7. Procédure de rollback

1. **Code** : Vercel → *Deployments* → *Promote to Production* sur le déploiement précédent ; Railway → *Deployments* → *Redeploy* du déploiement précédent.
2. **Base** : Railway Postgres → *Backups* (sauvegardes quotidiennes) ; avant une migration risquée : `pg_dump "$DATABASE_URL" > backup-AAAAMMJJ.sql`. Restauration : `psql "$DATABASE_URL" < backup.sql` sur une base vierge puis basculer `DATABASE_URL`.
3. Une migration additive n'a pas besoin d'être annulée pour revenir au code précédent.

## 8. CI GitHub Actions

`.github/workflows/ci.yml` lance lint, typecheck, tests (PostgreSQL de service) et build à chaque push sur `main` et sur chaque pull request.

Pousser une modification de ce fichier exige un jeton GitHub avec la permission `workflow`. Le jeton de `gh` ne l'a pas ; Git Credential Manager l'obtient par connexion navigateur, sans code à saisir :

```bash
git -c credential.namespace=glaciora-ci -c credential.gitHubAuthModes=browser push origin main
```

## 9. Checklist de mise en production

- [ ] `APP_ENV=production`, `COOKIE_SECURE=true`, `TRUST_PROXY=2`, secrets JWT uniques
- [ ] Compte bancaire principal (`BANK_*`) **réel** et vérifié ; comptes par pays vérifiés dans l'admin
- [ ] Brevo : expéditeur validé, clé saisie dans Railway, commande test reçue sur glacioara@outlook.fr (statut `SENT`)
- [ ] R2 privé configuré, dépôt d'un justificatif test, consultation depuis l'admin, URL inaccessible sans session
- [ ] Admin créé (mot de passe fort), `ADMIN_PASSWORD` absent des variables d'environnement
- [ ] Catalogue importé ; prix vérifiés ; **stocks saisis** ; produits en brouillon relus puis publiés
- [ ] **Tarifs de livraison réels** saisis (supprimer les tarifs `[DÉMO]`) ; pays activés
- [ ] Conditions de vente complétées (rétractation, garanties, retours)
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` verts ; E2E vert sur la préproduction
- [ ] `https://glaciora-chi.vercel.app/robots.txt` et `/sitemap.xml` répondent ; Search Console déclarée
- [ ] Sauvegardes Postgres Railway activées ; cron `proofs:purge` planifié
