// Lecture d'un justificatif PDF dans un processus séparé (voir src/modules/checkout/proof-check.ts) : le fichier vient d'un
// client, il est donc analysé hors de l'API, avec mémoire bornée et arrêt forcé au-delà du délai. Un PDF malformé qui ferait
// planter la bibliothèque (module natif de rendu) n'arrête que ce processus, jamais l'API.
// Entrée (message IPC) : { data: Uint8Array, maxPages: number, renderPages: number, minChars: number }.
// Sortie : { ok: true, text, images } — images = pages rendues en PNG quand le PDF n'a pas de texte (reçu scanné).
const { PDFParse } = require('pdf-parse');

const countChars = (text) => (text.match(/[0-9A-Za-zÀ-ÿ]/g) || []).length;

async function read(input) {
  const parser = new PDFParse({ data: input.data, isEvalSupported: false, stopAtErrors: false });
  try {
    const { text } = await parser.getText({ first: input.maxPages });
    let images = [];
    if (countChars(text) < input.minChars && input.renderPages > 0) {
      const shots = await parser.getScreenshot({ first: input.renderPages, desiredWidth: 1600, imageBuffer: true, imageDataUrl: false });
      images = shots.pages.map((page) => Buffer.from(page.data));
    }
    return { ok: true, text, images };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

process.once('message', (input) => {
  read(input)
    .catch((err) => ({ ok: false, error: err && err.message ? err.message : String(err) }))
    .then((result) => process.send(result, () => process.exit(0)));
});
