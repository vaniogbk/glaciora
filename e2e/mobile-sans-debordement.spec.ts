import { expect, test, type Page } from '@playwright/test';
import { E2E_ENV } from '../playwright.config';
import { horizontalOverflows, receiptPdf } from './helpers';

/**
 * Sur téléphone, aucune page ne doit déborder sur le côté (défilement horizontal, éléments coupés) : pages publiques dans
 * les langues aux mots les plus longs, commande en 2 étapes, espace client et administration, à 320 px (petit téléphone)
 * et 390 px (téléphone courant). Chaque problème est listé avec l'élément en cause.
 */

const PUBLIC_PAGES = [
  '/',
  '/catalogue',
  '/categorie/skis',
  '/categorie/skis-all-mountain-freeride',
  '/categorie/protections-hockey',
  '/recherche?q=casque',
  '/produit/zag-slap-98',
  '/produit/volkl-shine-76-vmotion-10-gw',
  '/produit/salomon-s-pro-supra-boa-100-gw',
  '/panier',
  '/commande',
  '/commande/suivi',
  '/compte/connexion',
  '/compte/inscription',
  '/compte/mot-de-passe-oublie',
  '/conditions-de-vente',
  '/page-inexistante',
];
const LOCALES = ['fr', 'de', 'fi', 'pl', 'is', 'lt'];

async function check(page: Page, label: string, problems: string[]) {
  await page.waitForLoadState('load');
  // Écrans d'administration et d'espace client : données chargées après l'affichage (squelettes « Chargement… »).
  await expect(page.getByText(/Chargement|Vérification de l’accès/)).toHaveCount(0, { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(200);
  const { scroll, overflows } = await horizontalOverflows(page);
  if (scroll > 0 || overflows.length > 0) {
    problems.push(`${label} : défilement de ${scroll} px — ${overflows.map((o) => `${o.element} « ${o.text} » (jusqu'à ${o.right} px)`).join(' ; ')}`);
  }
}

/** Appel à l'API depuis la page, comme le site : mêmes cookies de session que le navigateur. */
async function api<T>(page: Page, method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  return page.evaluate(
    async ({ method, path, body }) => {
      const res = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json', 'x-glaciora-csrf': '1' },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'same-origin',
      });
      return { status: res.status, data: await res.json().catch(() => null) };
    },
    { method, path, body },
  );
}

/**
 * Page ouverte et session du visiteur vérifiée par le site AVANT les appels d'API du test : sinon la vérification du site
 * (anonyme) peut arriver après la connexion du test et l'annuler.
 */
async function openBeforeApiCalls(page: Page) {
  await Promise.all([page.waitForResponse((r) => r.url().includes('/api/auth/me'), { timeout: 15_000 }).catch(() => undefined), page.goto('/conditions-de-vente')]);
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
}

async function addToCart(page: Page, slug: string) {
  const { data } = await api<{ product: { variants: { id: string }[] } }>(page, 'GET', `/api/catalogue/products/${slug}`);
  const added = await api(page, 'POST', '/api/cart/items', { variantId: data.product.variants[0]!.id, quantity: 1 });
  expect(added.status).toBe(201);
}

for (const width of [320, 390]) {
  test.describe(`téléphone ${width} px`, () => {
    test.use({ viewport: { width, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    test('pages publiques sans débordement, dans les langues aux mots les plus longs', async ({ page }) => {
      test.setTimeout(600_000);
      await openBeforeApiCalls(page);
      await addToCart(page, 'zag-slap-98');
      const problems: string[] = [];
      for (const locale of width === 320 ? LOCALES : ['fr', 'de']) {
        for (const path of PUBLIC_PAGES) {
          await page.goto(`${locale === 'fr' ? '' : `/${locale}`}${path}`);
          await check(page, `${locale}${path}`, problems);
        }
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });

    test('commande en 2 étapes, espace client et suivi sans débordement', async ({ page }) => {
      test.setTimeout(180_000);
      await openBeforeApiCalls(page);
      const email = `mobile.${width}.${Date.now()}@glaciora.test`;
      const password = 'Mobile-Test-2026';
      expect((await api(page, 'POST', '/api/auth/register', { email, password, firstName: 'Léa', lastName: 'Martin-Vandenberghe' })).status).toBeLessThan(300);
      expect((await api(page, 'POST', '/api/auth/login', { email, password })).status).toBe(200);
      await addToCart(page, 'giro-grid-spherical');
      const problems: string[] = [];

      await page.goto('/de/commande');
      await check(page, 'de/commande (étape 1)', problems);
      await page.getByTestId('country-select').selectOption('DE');
      await page.getByLabel(/^Vorname/).fill('Léa');
      await page.getByLabel(/^Nachname/).fill('Martin-Vandenberghe');
      await page.getByLabel(/^Adresse/).fill('Sehr lange Straßenbezeichnung 123');
      await page.getByLabel(/^Postleitzahl/).fill('80331');
      await page.getByLabel(/^Ort/).fill('München');
      await page.getByLabel(/^Telefon/).fill('+49 89 12345678');
      await page.getByTestId('continue-to-payment').click();
      await expect(page.getByTestId('checkout-step-2')).toBeVisible();
      await check(page, 'de/commande (étape 2, coordonnées bancaires)', problems);

      const reference = (await page.getByTestId('transfer-reference').textContent())!.trim();
      const amount = (await page.getByTestId('transfer-amount').textContent())!.trim();
      await page.locator('#proof').setInputFiles({ name: 'beleg.pdf', mimeType: 'application/pdf', buffer: await receiptPdf(page, reference, '1,00 €') });
      await page.locator('input[type=checkbox]').first().check();
      await page.getByTestId('place-order').click();
      await expect(page.getByTestId('proof-rejected')).toBeVisible();
      await check(page, 'de/commande (justificatif refusé)', problems);

      await page.locator('#proof').setInputFiles({ name: 'beleg.pdf', mimeType: 'application/pdf', buffer: await receiptPdf(page, reference, amount) });
      await page.getByTestId('place-order').click();
      await expect(page).toHaveURL(/\/commande\/confirmation/);
      await check(page, 'de/commande/confirmation', problems);

      for (const path of ['/de/compte', '/de/compte/adresses', '/de/compte/commandes', `/de/compte/commandes/${reference}`, `/de/commande/suivi?ref=${reference}`]) {
        await page.goto(path);
        await check(page, path.replace(reference, '[référence]'), problems);
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });

    test('administration sans débordement', async ({ page }) => {
      test.setTimeout(180_000);
      await openBeforeApiCalls(page);
      expect((await api(page, 'POST', '/api/auth/login', { email: E2E_ENV.E2E_ADMIN_EMAIL, password: E2E_ENV.E2E_ADMIN_PASSWORD })).status).toBe(200);
      const problems: string[] = [];
      const pages = ['/admin', '/admin/commandes', '/admin/produits', '/admin/produits/nouveau', '/admin/categories', '/admin/clients', '/admin/livraison', '/admin/banque', '/admin/import', '/admin/journaux'];
      const orders = await api<{ orders?: { id: string }[] }>(page, 'GET', '/api/admin/orders');
      expect(orders.status).toBe(200);
      if (orders.data.orders?.[0]) pages.push(`/admin/commandes/${orders.data.orders[0].id}`);
      const products = await api<{ products?: { id: string }[] }>(page, 'GET', '/api/admin/products');
      expect(products.status).toBe(200);
      if (products.data.products?.[0]) pages.push(`/admin/produits/${products.data.products[0].id}`);
      for (const path of pages) {
        await page.goto(path);
        await check(page, path, problems);
        if (path === '/admin') {
          // Menu d'administration ouvert (téléphone).
          await page.getByRole('button', { name: /Menu d’administration/ }).click();
          await check(page, '/admin (menu ouvert)', problems);
        }
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  });
}
