import fs from 'node:fs';
import path from 'node:path';
import { checkTransferProofs, shutdownProofReader } from '../src/modules/checkout/proof-check';
import { amountsInText, containsAmount, containsReference, isReadable } from '../src/modules/checkout/proof-match';

const REFERENCE = 'GLA-261109-7KQ4M';
const AMOUNT = 45490;

afterAll(() => shutdownProofReader());

describe('recherche de la référence', () => {
  it.each([
    ['Verwendungszweck: GLA-261109-7KQ4M', true],
    ['Motif : GLA2611097KQ4M (tirets supprimés par la banque)', true],
    ['référence gla-261109-7kq4m en minuscules', true],
    ['GLA-26II09-7KQ4M (1 lu comme I)', true],
    ['G LA - 261109 - 7KQ 4M', true],
    ['GLA-261109-7KQ4 (un caractère perdu)', true],
    ['GLA-261109-7KQ44M (un caractère en trop)', true],
    ['GLA-261109-7XQ4M (un caractère mal lu)', true],
    ['GLA-261109-ABCDE (autre commande)', false],
    ['GLA-261108-7KQ5N (deux caractères différents)', false],
    ['aucune référence ici', false],
  ])('%s → %s', (text, expected) => {
    expect(containsReference(text, REFERENCE)).toBe(expected);
  });
});

describe('recherche du montant', () => {
  it.each([
    ['Montant : 454,90 €', 45490, true],
    ['-454,90 EUR', 45490, true],
    ['EUR 454.90', 45490, true],
    ['Betrag 1.360,90 €', 136090, true],
    ['Amount 1,360.90', 136090, true],
    ['1 360,90 €', 136090, true],
    ['1\u202F360,90\u00A0€ (espaces insécables)', 136090, true],
    ['Qté 2 454,90 € (nombre voisin)', 45490, true],
    ['454, 90 € (espace parasite)', 45490, true],
    ['454,9O € (O lu à la place de 0)', 45490, true],
    ['1.360,- €', 136000, true],
    ['1360 €', 136000, true],
    ['EUR 1 360', 136000, true],
    ['454,00 €', 45490, false],
    ['45,49 €', 45490, false],
    ['IBAN DE89 3704 0044 0532 0130 00', 45490, false],
    ['Solde 4 549,00', 45490, false],
  ])('%s (%i centimes) → %s', (text, cents, expected) => {
    expect(containsAmount(text, cents)).toBe(expected);
  });

  it('ne confond pas un IBAN ou un numéro d’ordre avec un montant', () => {
    const found = amountsInText('FR76 3000 6000 0112 3456 7890 189 · Auftragsnummer 2026110900418833');
    expect([...found].filter((cents) => cents === AMOUNT)).toHaveLength(0);
  });

  it('juge illisible un document presque vide', () => {
    expect(isReadable('  ~ . , ')).toBe(false);
    expect(isReadable('Überweisung ausgeführt, Betrag 454,90 EUR')).toBe(true);
  });
});

describe('lecture réelle des justificatifs (PDF et OCR, sur le serveur)', () => {
  const fixture = (name: string) => fs.readFileSync(path.join(__dirname, 'fixtures', name));
  const expected = { reference: REFERENCE, amountCents: AMOUNT };

  it.each([
    ['recu-virement.pdf', 'application/pdf', 'pdf'],
    ['recu-scanne.pdf', 'application/pdf', 'pdf-ocr'],
    ['capture-claire.png', 'image/png', 'ocr'],
    ['capture-sombre.png', 'image/png', 'ocr'],
    ['photo-ecran.jpg', 'image/jpeg', 'ocr'],
  ])('%s : référence et montant trouvés', async (name, mime, method) => {
    const result = await checkTransferProofs([{ buffer: fixture(name), mime }], expected);
    expect(result).toMatchObject({ referenceFound: true, amountFound: true, readable: true, methods: [method] });
  });

  it('refuse un document sans rapport avec la commande', async () => {
    const result = await checkTransferProofs([{ buffer: fixture('sans-rapport.png'), mime: 'image/png' }], expected);
    expect(result).toMatchObject({ referenceFound: false, amountFound: false, readable: true });
  });

  it('refuse un vrai reçu dont le montant n’est pas celui de la commande', async () => {
    const result = await checkTransferProofs([{ buffer: fixture('recu-virement.pdf'), mime: 'application/pdf' }], { reference: REFERENCE, amountCents: 45990 });
    expect(result).toMatchObject({ referenceFound: true, amountFound: false });
  });

  it('cherche dans l’ensemble des fichiers déposés (reçu sur plusieurs captures)', async () => {
    const result = await checkTransferProofs(
      [
        { buffer: fixture('sans-rapport.png'), mime: 'image/png' },
        { buffer: fixture('recu-virement.pdf'), mime: 'application/pdf' },
      ],
      expected,
    );
    expect(result).toMatchObject({ referenceFound: true, amountFound: true });
  });

  it('traite un PDF corrompu comme illisible, sans planter', async () => {
    const result = await checkTransferProofs([{ buffer: Buffer.from('%PDF-1.7\n garbage \n%%EOF'), mime: 'application/pdf' }], expected);
    expect(result).toMatchObject({ referenceFound: false, amountFound: false, readable: false });
  });

  it('traite une image impossible à décoder comme illisible (pas comme une panne)', async () => {
    const fakePng = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300, 7)]);
    const result = await checkTransferProofs([{ buffer: fakePng, mime: 'image/png' }], expected);
    expect(result).toMatchObject({ referenceFound: false, amountFound: false, readable: false });
  });
});
