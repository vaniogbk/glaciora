import en from '@/i18n/legal-docs/en';
import fr from '@/i18n/legal-docs/fr';
import pl from '@/i18n/legal-docs/pl';
import type { LegalDoc, LegalDocs } from '@/i18n/legal-docs/types';

const VARS = new Set(['brand', 'site', 'seller', 'legalForm', 'registration', 'address', 'email', 'phone']);
const texts = (doc: LegalDoc) => [
  doc.version,
  ...doc.intro,
  ...doc.sections.flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? []), ...(s.after ?? [])]),
  ...(doc.annex ? [doc.annex.title, doc.annex.note, ...doc.annex.lines] : []),
];

describe.each([
  ['fr', fr],
  ['en', en],
  ['pl', pl],
] as [string, LegalDocs][])('conditions de vente et confidentialité (%s)', (lang, docs) => {
  it('a la même structure que la version française', () => {
    for (const kind of ['terms', 'privacy'] as const) {
      expect(docs[kind].sections.map((s) => [Boolean(s.paragraphs?.length), s.list?.length ?? 0, s.after?.length ?? 0])).toEqual(
        fr[kind].sections.map((s) => [Boolean(s.paragraphs?.length), s.list?.length ?? 0, s.after?.length ?? 0]),
      );
      expect(docs[kind].annex?.lines.length).toBe(fr[kind].annex?.lines.length);
    }
  });

  it('n’utilise que des variables connues et ne laisse aucune mention à compléter', () => {
    for (const text of [...texts(docs.terms), ...texts(docs.privacy)]) {
      for (const [, name] of text.matchAll(/\{(\w+)\}/g)) expect(VARS.has(name!)).toBe(true);
      expect(text).not.toMatch(/\[\[|SIRET|CNIL|Code de la consommation/);
    }
  });

  it('décrit les deux moyens de paiement, la rétractation et les droits RGPD', () => {
    const terms = texts(docs.terms).join(' ');
    expect(terms).toContain('SEPA');
    expect(terms).toContain('Mollie B.V.');
    expect(terms).toMatch(/14/);
    expect(docs.terms.annex?.lines.length).toBeGreaterThan(5);
    const privacy = texts(docs.privacy).join(' ');
    for (const word of ['Mollie', 'Brevo', 'Cloudflare', 'glaciora_cart', 'uodo.gov.pl', '400']) expect(privacy).toContain(word);
  });
});

it(`la version polonaise reprend les étapes de suivi affichées aux clients`, async () => {
  const plMessages = (await import('@/i18n/messages/pl')).default;
  const delivery = pl.terms.sections.find((s) => s.title.startsWith('7.'))!.paragraphs!.join(' ');
  for (const status of ['PREPARING', 'SHIPPED', 'DELIVERED']) expect(delivery).toContain(plMessages.orderStatus[status]);
});
