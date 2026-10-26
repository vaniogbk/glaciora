import { expect, test } from '@playwright/test';
import { E2E_ENV } from '../playwright.config';

/** Justificatif PDF minimal généré pour le test (aucune donnée réelle). */
const PROOF_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

test('parcours complet : accueil → catalogue → fiche → panier → virement → confirmation → admin', async ({ page }) => {
  // 1. Accueil
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Born for ice.');

  // 2. Navigation vers une catégorie
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Skis' }).click();
  await expect(page).toHaveURL(/\/categorie\/skis/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Skis');

  // 3. Filtres (marque)
  await page.getByLabel('Marque').selectOption('Zag');
  await expect(page).toHaveURL(/brand=Zag/);
  const cards = page.locator('article');
  await expect(cards.first()).toBeVisible();
  for (const brand of await page.locator('article .eyebrow').allTextContents()) expect(brand).toBe('Zag');

  // 4. Fiche produit
  await page.getByRole('link', { name: 'Slap 98' }).click();
  await expect(page).toHaveURL(/\/produit\/zag-slap-98/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slap 98');
  await expect(page.getByText('Référence :')).toContainText('GLA-005');

  // 5. Sélection de taille
  await page.getByRole('radio', { name: '180 cm' }).click();
  await expect(page.getByRole('radio', { name: '180 cm' })).toHaveAttribute('aria-checked', 'true');

  // 6. Ajout au panier
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByText(/ajouté au panier/)).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // 7. Checkout
  await page.goto('/panier');
  await expect(page.getByTestId('cart-line')).toHaveCount(1);
  await page.getByTestId('checkout-link').click();
  await expect(page).toHaveURL(/\/commande$/);

  // 8. Choix du pays
  await page.getByTestId('country-select').selectOption('FR');

  // 9. Formulaire de livraison
  await page.getByLabel('E-mail').fill('client.e2e@glaciora.test');
  await page.getByLabel('Prénom').fill('Léa');
  await page.getByLabel('Nom', { exact: true }).fill('Martin');
  await page.getByLabel('Adresse', { exact: true }).fill('12 route des Alpes');
  await page.getByLabel('Code postal').fill('74400');
  await page.getByLabel('Ville').fill('Chamonix');
  await page.getByLabel('Téléphone').fill('+33 6 12 34 56 78');
  await expect(page.getByText('[DÉMO] Livraison standard')).toBeVisible();

  // 10. Virement bancaire sélectionné, carte indisponible
  await expect(page.getByTestId('pay-bank-transfer')).toBeChecked();
  await expect(page.getByRole('radio', { name: /Carte bancaire/ })).toBeDisabled();
  await expect(page.getByText('Indisponible pour le moment')).toBeVisible();

  // 11. IBAN et QR code SEPA
  await page.getByTestId('show-bank-details').click();
  await expect(page.getByTestId('iban')).toHaveText('FR76 3000 6000 0112 3456 7890 189');
  await expect(page.getByTestId('sepa-qr')).toBeVisible();
  const reference = (await page.getByTestId('transfer-reference').textContent())!.trim();
  expect(reference).toMatch(/^GLA-\d{6}-[A-Z0-9]{5}$/);

  // 12. Upload de la confirmation de virement
  await page.getByLabel(/Confirmation de virement/).setInputFiles({ name: 'virement.pdf', mimeType: 'application/pdf', buffer: PROOF_PDF });

  // 13. Création de la commande
  await page.getByLabel(/J’accepte les/).check();
  await page.getByTestId('place-order').click();

  // 14. Page de confirmation
  await expect(page).toHaveURL(new RegExp(`/commande/confirmation\\?ref=${reference}`));
  await expect(page.getByTestId('confirmation-title')).toContainText(reference);
  await expect(page.getByTestId('order-status')).toHaveText('En attente de vérification du paiement');
  await expect(page.getByTestId('cart-count')).toHaveCount(0);

  // 15. Connexion admin
  await page.goto('/compte/connexion?retour=/admin/commandes');
  await page.getByLabel('E-mail').fill(E2E_ENV.E2E_ADMIN_EMAIL);
  await page.getByLabel('Mot de passe').fill(E2E_ENV.E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/admin\/commandes/);

  // 16. Consultation de la commande et du fichier de confirmation
  await page.getByRole('link', { name: reference }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(reference);
  await expect(page.getByTestId('admin-order-status')).toHaveText('En attente de vérification du paiement');
  const proofHref = await page.getByTestId('view-proof').getAttribute('href');
  const proof = await page.request.get(proofHref!);
  expect(proof.status()).toBe(200);
  expect(proof.headers()['content-type']).toBe('application/pdf');
  expect((await proof.body()).subarray(0, 5).toString()).toBe('%PDF-');

  // Le fichier n'est jamais accessible sans session admin.
  const anonymous = await page.context().browser()!.newContext();
  const denied = await anonymous.request.get(`http://localhost:3000${proofHref}`);
  expect(denied.status()).toBe(401);
  await anonymous.close();
});
