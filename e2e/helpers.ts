import type { Page } from '@playwright/test';

/** Faux reçu de virement (banque fictive) en PDF, comme celui que la banque du client permet de télécharger. */
export async function receiptPdf(page: Page, reference: string, amount: string): Promise<Buffer> {
  const doc = await page.context().newPage();
  await doc.setContent(
    `<!doctype html><html><body style="font:16px Arial;padding:24px"><h1>Banque Exemple</h1><p>Virement émis</p><p>Bénéficiaire : Boutique Exemple</p><p>Montant : ${amount}</p><p>Référence : ${reference}</p></body></html>`,
  );
  const pdf = await doc.pdf({ width: '400px', height: '600px' });
  await doc.close();
  return pdf;
}

export interface Overflow {
  element: string;
  text: string;
  right: number;
}

/**
 * Éléments ou lignes de texte qui sortent de l'écran à droite (ou à gauche) : ce qui fait « déborder » une page sur téléphone.
 * Ignore le texte réservé aux lecteurs d'écran, les éléments fixes et ce qui est rogné par un conteneur (carrousel, tableau
 * défilant). Ne garde que la cause la plus précise (l'élément le plus profond).
 */
export async function horizontalOverflows(page: Page): Promise<{ scroll: number; overflows: Overflow[] }> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const scroll = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
    // includeSelf : un texte raccourci volontairement (« … », overflow hidden sur son propre bloc) ne déborde pas.
    const clippedByAncestor = (el: Element, includeSelf = false) => {
      for (let p = includeSelf ? el : el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(hidden|auto|scroll|clip)/.test(s.overflowX) && p !== document.body) {
          const r = p.getBoundingClientRect();
          if (r.right <= vw + 0.5 && r.left >= -0.5) return true;
        }
      }
      return false;
    };
    const found: Element[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || (r.right <= vw + 0.5 && r.left >= -0.5)) continue;
      if (el.closest('.sr-only')) continue;
      const s = getComputedStyle(el);
      if (s.position === 'fixed' || s.visibility === 'hidden') continue;
      if (!clippedByAncestor(el)) found.push(el);
    }
    // Mots trop longs : le texte dépasse de son bloc sans que le bloc lui-même ne déborde.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const host = node.parentElement;
      if (!node.textContent?.trim() || !host || host.closest('.sr-only') || getComputedStyle(host).visibility === 'hidden') continue;
      range.selectNodeContents(node);
      const outside = Array.from(range.getClientRects()).some((r) => r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5));
      if (outside && !clippedByAncestor(host, true) && !found.includes(host)) found.push(host);
    }
    const leaves = found.filter((el) => !found.some((other) => other !== el && el.contains(other)));
    return {
      scroll,
      overflows: leaves.slice(0, 5).map((el) => ({
        element: `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : ''}`,
        text: ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50),
        right: Math.round(el.getBoundingClientRect().right),
      })),
    };
  });
}
