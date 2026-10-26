import { buildEpcQrPayload, formatIban, isValidIban } from '../sepa';
import { detectMimeFromBytes, sanitizeFileName, validateProofFile } from '../upload';
import { canTransition, generateOrderReference } from '../order';
import { checkoutSchema } from '../schemas';

// IBAN d'exemple publiés (documentation bancaire) : aucun compte réel.
const EXAMPLE_IBAN = 'FR76 3000 6000 0112 3456 7890 189';

describe('IBAN', () => {
  it('valide la clé modulo 97', () => {
    expect(isValidIban(EXAMPLE_IBAN)).toBe(true);
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('FR7630006000011234567890188')).toBe(false);
    expect(isValidIban('pas un iban')).toBe(false);
  });

  it('formate par groupes de 4', () => {
    expect(formatIban('fr7630006000011234567890189')).toBe(EXAMPLE_IBAN);
  });
});

describe('QR code SEPA (EPC069-12)', () => {
  it('produit la charge utile normalisée', () => {
    const payload = buildEpcQrPayload({
      beneficiaryName: 'GLACIORA',
      iban: EXAMPLE_IBAN,
      bic: 'agrifrpp',
      amountCents: 123456,
      remittanceText: 'GLA-261026-7KQ4M',
    });
    expect(payload.split('\n')).toEqual([
      'BCD', '002', '1', 'SCT', 'AGRIFRPP', 'GLACIORA', 'FR7630006000011234567890189', 'EUR1234.56', '', '', 'GLA-261026-7KQ4M',
    ]);
  });

  it('accepte l’absence de BIC (version 002)', () => {
    const payload = buildEpcQrPayload({ beneficiaryName: 'GLACIORA', iban: EXAMPLE_IBAN, amountCents: 1, remittanceText: 'X' });
    expect(payload.split('\n')[4]).toBe('');
    expect(payload).toContain('EUR0.01');
  });

  it('refuse les données invalides', () => {
    const base = { beneficiaryName: 'GLACIORA', iban: EXAMPLE_IBAN, amountCents: 100, remittanceText: 'REF' };
    expect(() => buildEpcQrPayload({ ...base, iban: 'FR00' })).toThrow('IBAN');
    expect(() => buildEpcQrPayload({ ...base, bic: '123' })).toThrow('BIC');
    expect(() => buildEpcQrPayload({ ...base, amountCents: 0 })).toThrow('Montant');
    expect(() => buildEpcQrPayload({ ...base, beneficiaryName: 'x'.repeat(71) })).toThrow();
    expect(() => buildEpcQrPayload({ ...base, remittanceText: 'x'.repeat(141) })).toThrow();
  });
});

describe('fichiers de confirmation de virement', () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
  const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
  const max = 10 * 1024 * 1024;

  it('détecte le type réel par signature', () => {
    expect(detectMimeFromBytes(pdf)).toBe('application/pdf');
    expect(detectMimeFromBytes(png)).toBe('image/png');
    expect(detectMimeFromBytes(jpg)).toBe('image/jpeg');
    expect(detectMimeFromBytes(webp)).toBe('image/webp');
    expect(detectMimeFromBytes(exe)).toBeNull();
  });

  it('accepte un PDF valide et normalise le nom', () => {
    const r = validateProofFile({ bytes: pdf, sizeBytes: 2048, originalName: '../../Reçu virement é.pdf', declaredMime: 'application/pdf', maxBytes: max });
    expect(r).toEqual({ ok: true, mime: 'application/pdf', extension: 'pdf', safeName: 'Recu_virement_e.pdf' });
  });

  it('refuse un exécutable déguisé, un type incohérent, un fichier vide ou trop gros', () => {
    expect(validateProofFile({ bytes: exe, sizeBytes: 10, originalName: 'recu.pdf', declaredMime: 'application/pdf', maxBytes: max })).toEqual({ ok: false, error: 'UNSUPPORTED_TYPE' });
    expect(validateProofFile({ bytes: png, sizeBytes: 10, originalName: 'recu.pdf', declaredMime: 'application/pdf', maxBytes: max })).toEqual({ ok: false, error: 'TYPE_MISMATCH' });
    expect(validateProofFile({ bytes: pdf, sizeBytes: 0, originalName: 'recu.pdf', declaredMime: 'application/pdf', maxBytes: max })).toEqual({ ok: false, error: 'EMPTY' });
    expect(validateProofFile({ bytes: pdf, sizeBytes: max + 1, originalName: 'recu.pdf', declaredMime: 'application/pdf', maxBytes: max })).toEqual({ ok: false, error: 'TOO_LARGE' });
  });

  it('corrige une extension trompeuse', () => {
    const r = validateProofFile({ bytes: png, sizeBytes: 10, originalName: 'capture.exe', declaredMime: 'image/png', maxBytes: max });
    expect(r.ok && r.safeName).toBe('capture.png');
    expect(sanitizeFileName('')).toBe('fichier');
  });
});

describe('commandes', () => {
  it('génère une référence lisible et stable', () => {
    const ref = generateOrderReference(new Date('2026-10-26T12:00:00Z'), new Uint8Array([0, 1, 2, 3, 4]));
    expect(ref).toBe('GLA-261026-23456');
  });

  it('n’autorise que les transitions prévues', () => {
    expect(canTransition('PENDING_PAYMENT_VERIFICATION', 'PAID')).toBe(true);
    expect(canTransition('PENDING_PAYMENT_VERIFICATION', 'SHIPPED')).toBe(false);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });

  it('valide le formulaire de checkout', () => {
    const valid = {
      email: 'Client@Example.com ',
      shippingAddress: { firstName: 'Léa', lastName: 'Martin', line1: '1 rue des Alpes', postalCode: '74400', city: 'Chamonix', countryCode: 'fr', phone: '+33 6 00 00 00 00' },
      shippingRateId: 'std',
      paymentMethod: 'BANK_TRANSFER',
      acceptTerms: true,
    };
    const parsed = checkoutSchema.parse(valid);
    expect(parsed.email).toBe('client@example.com');
    expect(parsed.shippingAddress.countryCode).toBe('FR');
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: 'CARD' }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
});
