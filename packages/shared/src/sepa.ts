/** Normalise un IBAN (majuscules, sans espaces). */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

/** Contrôle ISO 13616 (modulo 97). */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function formatIban(raw: string): string {
  return normalizeIban(raw).replace(/(.{4})/g, '$1 ').trim();
}

export interface EpcPayloadInput {
  beneficiaryName: string;
  iban: string;
  bic?: string;
  amountCents: number;
  /** Texte libre de rapprochement (référence de commande). */
  remittanceText: string;
}

/**
 * Construit le contenu d'un QR code SEPA (EPC069-12, version 002, UTF-8, virement SCT).
 * Lève une erreur si une donnée est hors norme : mieux vaut aucun QR qu'un QR faux.
 */
export function buildEpcQrPayload(input: EpcPayloadInput): string {
  const iban = normalizeIban(input.iban);
  if (!isValidIban(iban)) throw new Error('IBAN invalide');
  const bic = (input.bic ?? '').replace(/\s+/g, '').toUpperCase();
  if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) throw new Error('BIC invalide');
  const name = input.beneficiaryName.trim();
  if (!name || name.length > 70) throw new Error('Nom du bénéficiaire invalide (1 à 70 caractères)');
  if (!Number.isInteger(input.amountCents) || input.amountCents < 1 || input.amountCents > 99_999_999_999) {
    throw new Error('Montant invalide');
  }
  const remittance = input.remittanceText.trim();
  if (remittance.length > 140) throw new Error('Référence trop longue (140 caractères max.)');
  const amount = `EUR${(input.amountCents / 100).toFixed(2)}`;
  const lines = ['BCD', '002', '1', 'SCT', bic, name, iban, amount, '', '', remittance];
  const payload = lines.join('\n');
  if (new TextEncoder().encode(payload).length > 331) throw new Error('Contenu du QR code trop long');
  return payload;
}
