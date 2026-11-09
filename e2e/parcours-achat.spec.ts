import { expect, test } from '@playwright/test';
import { E2E_ENV } from '../playwright.config';
import { receiptPdf } from './helpers';


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
  // Affichage optimiste : on attend aussi la confirmation du serveur avant de changer de page.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/cart/items') && r.request().method() === 'POST' && r.status() === 201),
    page.getByTestId('add-to-cart').click(),
  ]);
  await expect(page.getByText(/ajouté au panier/)).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // 7. Checkout
  await page.goto('/panier');
  await expect(page.getByTestId('cart-line')).toHaveCount(1);
  await page.getByTestId('checkout-link').click();
  await expect(page).toHaveURL(/\/commande$/);

  // 8. Étape 1 : informations et livraison
  await expect(page.getByTestId('checkout-step-1')).toBeVisible();
  await page.getByTestId('country-select').selectOption('FR');
  await page.getByLabel('E-mail').fill('client.e2e@glaciora.test');
  await page.getByLabel('Prénom').fill('Léa');
  await page.getByLabel(/^Nom/).fill('Martin');
  await page.getByLabel(/^Adresse/).fill('12 route des Alpes');
  await page.getByLabel('Code postal').fill('74400');
  await page.getByLabel('Ville').fill('Chamonix');
  await page.getByLabel('Téléphone').fill('+33 6 12 34 56 78');
  await expect(page.getByText('[DÉMO] Livraison standard')).toBeVisible();
  await page.getByTestId('continue-to-payment').click();

  // 9. Étape 2 : coordonnées bancaires du pays choisi, virement sélectionné, carte indisponible
  await expect(page.getByTestId('checkout-step-2')).toBeVisible();
  await expect(page.getByTestId('delivery-recap')).toContainText('12 route des Alpes');
  await expect(page.getByTestId('pay-bank-transfer')).toBeChecked();
  await expect(page.getByRole('radio', { name: /Carte bancaire/ })).toBeDisabled();
  await expect(page.getByText('Indisponible pour le moment')).toBeVisible();
  await expect(page.getByTestId('iban')).toHaveText('FR76 3000 6000 0112 3456 7890 189');
  await expect(page.getByTestId('sepa-qr')).toBeVisible();
  const reference = (await page.getByTestId('transfer-reference').textContent())!.trim();
  const amount = (await page.getByTestId('transfer-amount').textContent())!.trim();
  expect(reference).toMatch(/^GLA-\d{6}-[A-Z0-9]{5}$/);

  // 10. Retour du navigateur : étape 1 avec les informations saisies ; la même référence est reprise ensuite.
  await page.goBack();
  await expect(page.getByTestId('checkout-step-1')).toBeVisible();
  await expect(page.getByLabel('Ville')).toHaveValue('Chamonix');
  await page.getByTestId('continue-to-payment').click();
  await expect(page.getByTestId('transfer-reference')).toHaveText(reference);

  // 11. Justificatif dont le montant ne correspond pas : refusé par le contrôle automatique, aucune commande créée.
  await page.getByLabel(/Preuve de virement/).setInputFiles({ name: 'autre-virement.pdf', mimeType: 'application/pdf', buffer: await receiptPdf(page, reference, '12,00 €') });
  await page.getByLabel(/J’accepte les/).check();
  await page.getByTestId('place-order').click();
  await expect(page.getByTestId('proof-rejected')).toContainText(`le montant exact de la commande (${amount})`);
  await expect(page).toHaveURL(/\/commande$/);

  // 12. Bon justificatif (référence et montant exacts) : accepté, la commande est créée.
  await page.getByLabel(/Preuve de virement/).setInputFiles({ name: 'virement.pdf', mimeType: 'application/pdf', buffer: await receiptPdf(page, reference, amount) });
  await expect(page.getByTestId('proof-rejected')).toHaveCount(0);
  await page.getByTestId('place-order').click();

  // 13. Page de confirmation
  await expect(page).toHaveURL(new RegExp(`/commande/confirmation\\?ref=${reference}`));
  await expect(page.getByTestId('confirmation-title')).toContainText(reference);
  await expect(page.getByTestId('order-status')).toHaveText('En préparation');
  await expect(page.getByTestId('tracking-message')).toHaveText('Votre commande est en préparation auprès du fournisseur. Merci de patienter!');
  await expect(page.getByTestId('cart-count')).toHaveCount(0);

  // 14. Connexion admin
  await page.goto('/compte/connexion?retour=/admin/commandes');
  await page.getByLabel('E-mail').fill(E2E_ENV.E2E_ADMIN_EMAIL);
  await page.getByLabel('Mot de passe').fill(E2E_ENV.E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/admin\/commandes/);

  // 15. Consultation de la commande, du contrôle automatique et du fichier de confirmation
  await page.getByRole('link', { name: reference }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(reference);
  await expect(page.getByTestId('admin-order-status')).toHaveText('En préparation');
  await expect(page.getByTestId('proof-check')).toContainText('Référence et montant trouvés sur le justificatif (texte du PDF)');
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
