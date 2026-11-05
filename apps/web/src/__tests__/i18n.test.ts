import { LOCALES, localizePath, matchLocale, stripLocale } from '@/i18n/config';
import { plural } from '@/i18n/format';
import { getMessages } from '@/i18n/messages';
import fr from '@/i18n/messages/fr';

/** Variables {x} et mentions [[…]] d'un texte, pour vérifier qu'une traduction n'en perd aucune. */
const tokens = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const toFillCount = (text: string) => (text.match(/\[\[/g) ?? []).length;

function walk(source: unknown, target: unknown, path: string, issues: string[]) {
  if (typeof source === 'string') {
    if (typeof target !== 'string' || !target.trim()) issues.push(`${path} : texte manquant`);
    else if (tokens(source) !== tokens(target)) issues.push(`${path} : variables ${tokens(target)} au lieu de ${tokens(source)}`);
    else if (toFillCount(source) !== toFillCount(target)) issues.push(`${path} : mentions à compléter différentes`);
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(target) || target.length !== source.length) issues.push(`${path} : ${source.length} éléments attendus`);
    else source.forEach((item, i) => walk(item, target[i], `${path}[${i}]`, issues));
    return;
  }
  if (source && typeof source === 'object') {
    const t = (target ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(source)) {
      // Pluriels : chaque langue a ses propres formes (one/few/many…) ; « other » obligatoire, variables identiques.
      if (value && typeof value === 'object' && 'other' in value && !Array.isArray(value)) {
        const forms = t[key] as Record<string, string> | undefined;
        if (!forms?.other) issues.push(`${path}.${key} : forme « other » manquante`);
        else for (const [form, text] of Object.entries(forms)) if (tokens(text) !== tokens((value as { other: string }).other) && tokens(text) !== '') issues.push(`${path}.${key}.${form} : variables`);
        continue;
      }
      walk(value, t[key], `${path}.${key}`, issues);
    }
  }
}

describe('traductions du site', () => {
  it.each(LOCALES.filter((l) => l !== 'fr'))('%s : toutes les clés, variables et mentions du français', async (locale) => {
    const issues: string[] = [];
    walk(fr, await getMessages(locale), locale, issues);
    expect(issues).toEqual([]);
  });

  it('garde au mot près les messages de suivi français', () => {
    expect(fr.tracking.steps.map((s) => s.message)).toEqual([
      'Votre commande est en préparation auprès du fournisseur. Merci de patienter!',
      'Votre commande est déjà en route vers votre adresse.',
      'Votre commande est arrivée à votre adresse. Merci pour l’achat.',
    ]);
  });

  it('choisit la langue du navigateur et retombe sur le français', () => {
    expect(matchLocale('de-AT,de;q=0.9,en;q=0.8')).toBe('de');
    expect(matchLocale('ja-JP,en;q=0.5')).toBe('en');
    expect(matchLocale('nn-NO')).toBe('nb');
    expect(matchLocale('ja-JP')).toBeNull();
    expect(matchLocale('fr-CH, de;q=0.9')).toBe('fr');
  });

  it('préfixe les adresses sauf en français', () => {
    expect(localizePath('fr', '/produit/x')).toBe('/produit/x');
    expect(localizePath('sk', '/')).toBe('/sk');
    expect(stripLocale('/it/commande/suivi')).toBe('/commande/suivi');
    expect(stripLocale('/catalogue')).toBe('/catalogue');
  });

  it('accorde les pluriels selon la langue', async () => {
    const pl = await getMessages('pl');
    expect(plural('pl', 1, pl.home.productCount)).toBe('1 produkt');
    expect(plural('pl', 3, pl.home.productCount)).toBe('3 produkty');
    expect(plural('pl', 5, pl.home.productCount)).toBe('5 produktów');
    expect(plural('fr', 2, fr.home.productCount)).toBe('2 produits');
  });
});
