import { expect, test, type Page } from '@playwright/test';

/**
 * Tests de vitesse sur téléphone lent et réseau lent (profil « mobile » de Lighthouse) :
 * latence 150 ms, 1,6 Mbit/s descendant, 750 kbit/s montant, processeur ralenti 4×, écran de Pixel 5.
 * Cible par défaut : le site en ligne (PERF_BASE_URL pour une autre adresse). Hors CI : `npm run test:perf`.
 */
const BASE = (process.env.PERF_BASE_URL ?? 'https://www.glaciora.online').replace(/\/$/, '');
const PRODUCT_SLUG = process.env.PERF_PRODUCT_SLUG ?? 'zag-slap-98';

const PAGES = [
  { name: 'Accueil', path: '/' },
  { name: 'Catalogue', path: '/catalogue' },
  { name: 'Fiche produit', path: `/produit/${PRODUCT_SLUG}` },
];

const NETWORK = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const CPU_SLOWDOWN = 4;
/** Seuils « bon » des Core Web Vitals pour LCP (2,5 s) et « à améliorer » au-delà de 4 s ; FCP 1,8 s / 3 s. */
const BUDGET_MS = { lcp: 4000, fcp: 3000 };
/** Seuil « bon » des Core Web Vitals pour le CLS. */
const CLS_BUDGET = 0.1;

interface Metrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  load: number;
  kb: number;
}

async function measure(page: Page, url: string): Promise<Metrics> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NETWORK);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number; __cls: number };
    w.__lcp = 0;
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    // Décalages de mise en page non provoqués par l'utilisateur (somme simple, suffisante pour une page sans défilement).
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) w.__cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  // On mesure l'affichage, pas le chargement complet (images sous l'écran, préchargements) qui peut durer bien plus longtemps.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  // LCP stabilisé : aucune nouvelle valeur pendant 3 s (30 s au plus).
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __lcp: number; __lcpSeen?: number; __lcpAt?: number };
      if (w.__lcp !== w.__lcpSeen) {
        w.__lcpSeen = w.__lcp;
        w.__lcpAt = performance.now();
      }
      return w.__lcp > 0 && performance.now() - (w.__lcpAt ?? 0) > 3000;
    },
    undefined,
    { timeout: 30_000, polling: 250 },
  );
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), nav.transferSize || 0);
    return {
      ttfb: Math.round(nav.responseStart),
      fcp: Math.round(fcp),
      lcp: Math.round((window as unknown as { __lcp: number }).__lcp),
      cls: Math.round((window as unknown as { __cls: number }).__cls * 1000) / 1000,
      load: Math.round(nav.loadEventEnd || performance.now()),
      kb: Math.round(bytes / 1024),
    };
  });
}

for (const { name, path } of PAGES) {
  test(`${name} : téléphone lent, réseau mobile lent`, async ({ page, request }) => {
    // Page déjà en cache côté serveur (situation d'un visiteur courant) ; navigateur à froid.
    await request.get(`${BASE}${path}`);
    const m = await measure(page, `${BASE}${path}`);
    console.log(`${name.padEnd(14)} TTFB ${String(m.ttfb).padStart(5)} ms · FCP ${String(m.fcp).padStart(5)} ms · LCP ${String(m.lcp).padStart(5)} ms · CLS ${m.cls.toFixed(3)} · chargé ${String(m.load).padStart(5)} ms · ${m.kb} Ko`);
    test.info().annotations.push({ type: 'mesures', description: JSON.stringify(m) });
    expect.soft(m.fcp, 'First Contentful Paint').toBeLessThan(BUDGET_MS.fcp);
    expect.soft(m.lcp, 'Largest Contentful Paint').toBeLessThan(BUDGET_MS.lcp);
    expect.soft(m.cls, 'Cumulative Layout Shift').toBeLessThan(CLS_BUDGET);
  });
}
