// Génère les justificatifs de test (faux reçus de virement, banque fictive) utilisés par tests/proof-check.test.ts :
//   node apps/api/tests/fixtures/generate-proof-fixtures.cjs
// Référence et montant fixes : GLA-261109-7KQ4M, 454,90 €. Fichiers produits :
//   recu-virement.pdf   PDF avec texte (reçu téléchargé depuis la banque)
//   recu-scanne.pdf     PDF sans texte (reçu scanné : une seule image)
//   capture-claire.png  capture d'écran de téléphone, thème clair
//   capture-sombre.png  capture d'écran de téléphone, thème sombre
//   photo-ecran.jpg     photo de l'écran : inclinée, floue, contraste réduit, JPEG compressé
//   sans-rapport.png    document sans rapport avec la commande
// Chromium ne sert qu'à produire les PDF (ses captures d'écran se bloquent sur certains postes Windows) ;
// les images sont rendues depuis ces PDF par pdf-parse, puis retouchées avec sharp.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { PDFParse } = require('pdf-parse');
const sharp = require('sharp');

const OUT = __dirname;

const receipt = (dark) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
  @page { margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 28px 22px; background: ${dark ? '#121417' : '#fff'}; color: ${dark ? '#e9edf1' : '#1b1f24'}; }
  h1 { font-size: 22px; margin: 0 0 4px; } .ok { color: ${dark ? '#5fd38d' : '#137a3a'}; font-weight: 700; margin-bottom: 18px; }
  .amount { font-size: 34px; font-weight: 800; margin: 10px 0 20px; }
  dl { margin: 0; } dt { font-size: 13px; color: ${dark ? '#9aa4ae' : '#5c6670'}; margin-top: 12px; } dd { margin: 2px 0 0; font-size: 17px; }
  .foot { margin-top: 26px; font-size: 12px; color: ${dark ? '#8a949e' : '#6b747d'}; }
</style></head><body>
  <h1>Banque Exemple</h1>
  <div class="ok">Überweisung ausgeführt</div>
  <dl>
    <dt>Betrag</dt><dd class="amount">-454,90 EUR</dd>
    <dt>Empfänger</dt><dd>Boutique Exemple SAS</dd>
    <dt>IBAN des Empfängers</dt><dd>FR76 3000 6000 0112 3456 7890 189</dd>
    <dt>Verwendungszweck</dt><dd>GLA-261109-7KQ4M</dd>
    <dt>Ausführungsdatum</dt><dd>09.11.2026</dd>
    <dt>Kontostand nach Buchung</dt><dd>2.318,44 EUR</dd>
  </dl>
  <p class="foot">Auftragsnummer 2026110900418833 · Dieser Beleg wurde elektronisch erstellt.</p>
</body></html>`;

const unrelated = `<!doctype html><html><head><meta charset="utf-8"><style>@page { margin: 0; }</style></head>
<body style="font:18px Arial;padding:30px"><h1>Rechnung Nr. 4471</h1><p>Lieferung Brennholz, 2 Ster</p><p>Summe 180,00 EUR</p><p>Vielen Dank für Ihren Einkauf.</p></body></html>`;

/** Format d'un écran de téléphone (390 × 760 px CSS). */
const PHONE = { width: '390px', height: '760px', printBackground: true };

async function pdfFromHtml(browser, html, options = PHONE) {
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf(options);
  await page.close();
  return pdf;
}

/** Première page d'un PDF rendue en PNG, à la résolution d'un écran de téléphone (×3). */
async function renderFirstPage(pdf) {
  const parser = new PDFParse({ data: new Uint8Array(pdf), isEvalSupported: false });
  try {
    const shot = await parser.getScreenshot({ first: 1, desiredWidth: 1170, imageBuffer: true, imageDataUrl: false });
    return Buffer.from(shot.pages[0].data);
  } finally {
    await parser.destroy();
  }
}

(async () => {
  const browser = await chromium.launch();
  const light = await pdfFromHtml(browser, receipt(false));
  const dark = await pdfFromHtml(browser, receipt(true));
  const other = await pdfFromHtml(browser, unrelated, { width: '600px', height: '400px', printBackground: true });

  fs.writeFileSync(path.join(OUT, 'recu-virement.pdf'), light);
  const lightPng = await renderFirstPage(light);
  fs.writeFileSync(path.join(OUT, 'capture-claire.png'), lightPng);
  fs.writeFileSync(path.join(OUT, 'capture-sombre.png'), await renderFirstPage(dark));
  fs.writeFileSync(path.join(OUT, 'sans-rapport.png'), await renderFirstPage(other));

  await sharp(lightPng)
    .rotate(4, { background: '#d9d4cc' })
    .linear(0.8, 25)
    .blur(0.8)
    .resize({ width: 1000 })
    .jpeg({ quality: 70 })
    .toFile(path.join(OUT, 'photo-ecran.jpg'));

  // Reçu scanné : PDF qui ne contient qu'une image (aucun texte sélectionnable).
  const scan = await sharp(lightPng).resize({ width: 780 }).png().toBuffer();
  const scanned = await pdfFromHtml(
    browser,
    `<!doctype html><html><head><style>@page { margin: 0; } body { margin: 0; }</style></head><body><img src="data:image/png;base64,${scan.toString('base64')}" style="width:390px;display:block"></body></html>`,
  );
  fs.writeFileSync(path.join(OUT, 'recu-scanne.pdf'), scanned);

  await browser.close();
  console.log('Justificatifs de test générés dans', OUT);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
