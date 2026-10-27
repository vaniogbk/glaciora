import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@glaciora/shared';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HomeVisual } from '@/components/home/HomeVisual';
import { Reveal } from '@/components/ui/Reveal';
import { getCategories, getHome } from '@/lib/server-api';
import type { ProductCard } from '@/lib/types';

export const metadata: Metadata = {
  title: { absolute: 'GLACIORA — Skis, chaussures de ski, patins et crosses de hockey' },
  description:
    'Skis all-mountain, freeride et junior, chaussures de ski, patins et crosses de hockey sur glace, casques, masques et DVA : l’équipement GLACIORA pour la neige et la glace, livré en Europe.',
  alternates: { canonical: '/' },
};

export const revalidate = 60;

function Section({ id, eyebrow, title, href, linkLabel, products }: { id: string; eyebrow: string; title: string; href: string; linkLabel: string; products: ProductCard[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="container py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={id} className="mt-2 text-2xl sm:text-3xl">
            {title}
          </h2>
        </div>
        <Link href={href} className="text-sm font-semibold text-deep hover:underline">
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

const ADVANTAGES = [
  { title: 'Livraison en Europe', text: 'France, Allemagne, Autriche, Suisse, Scandinavie et Europe centrale.', icon: 'M3 7h11v8H3zM14 10h4l3 3v2h-7M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z' },
  { title: 'Virement bancaire SEPA', text: 'QR code prêt à scanner et commande vérifiée par notre équipe.', icon: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4' },
  { title: 'Marques de référence', text: 'Völkl, Zag, Salomon, Nordica, Lange, Bauer, CCM, Warrior…', icon: 'm12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8L3.5 9.2l5.9-.9L12 3Z' },
  { title: 'Conseil par téléphone', text: 'Une question de taille ou de modèle ? Appelez-nous ou écrivez sur WhatsApp.', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2' },
];

export default async function HomePage() {
  const [home, categories] = await Promise.all([getHome(), getCategories()]);
  const tiles = categories.filter((c) => !c.parentId && c.productCount > 0);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-marine text-white" aria-labelledby="titre-accueil">
        <HomeVisual name="skiBanner" priority position="70% center" />
        <div className="absolute inset-0 bg-gradient-to-r from-marine via-marine/80 to-transparent" aria-hidden="true" />
        <div className="container relative py-20 sm:py-28 lg:py-36">
          <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Ski · Hockey sur glace · Sports de neige</p>
          <h1 id="titre-accueil" className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Born for ice.
            <span className="block text-glacier">Made for adventure.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/85 sm:text-lg">
            Skis, chaussures, patins, crosses et protections des grandes marques, sélectionnés pour la piste, la poudreuse et la patinoire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categorie/skis" className="btn-accent">
              Découvrir le ski <span aria-hidden="true">→</span>
            </Link>
            <Link href="/categorie/hockey" className="btn-ghost-light">
              Découvrir le hockey <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {tiles.length > 0 && (
        <nav aria-label="Catégories" className="container -mt-8 relative z-10">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((c, index) => (
              <li key={c.id}>
                <Reveal delay={index * 80}>
                  <Link href={`/categorie/${c.slug}`} className="card flex h-full flex-col justify-between p-5 transition hover:-translate-y-1 hover:shadow-lift">
                    <span className="text-lg font-extrabold text-marine">{c.name}</span>
                    <span className="mt-2 text-sm text-muted">
                      {c.productCount} produit{c.productCount > 1 ? 's' : ''} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Section id="produits-phares" eyebrow="Sélection" title="Nos produits phares" href="/catalogue" linkLabel="Tout le catalogue" products={home.featured} />

      <section className="container grid gap-4 py-6 md:grid-cols-2" aria-label="Collections">
        <Link href="/categorie/skis" className="group relative isolate flex min-h-[280px] overflow-hidden rounded-xl bg-marine p-8 text-white">
          <HomeVisual name="collectionSki" className="transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-marine/90 via-marine/40 to-transparent" aria-hidden="true" />
          <div className="relative mt-auto">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Collection</p>
            <h2 className="mt-1 text-4xl font-extrabold text-white">SKI</h2>
            <p className="mt-2 text-sm text-white/85">Skis · Chaussures · Casques · Masques · Sécurité</p>
            <span className="btn mt-5 bg-white text-marine group-hover:bg-glacier">Voir la collection <span aria-hidden="true">→</span></span>
          </div>
        </Link>
        <Link href="/categorie/hockey" className="group relative isolate flex min-h-[280px] overflow-hidden rounded-xl bg-marine p-8 text-white">
          <HomeVisual name="collectionHockey" className="transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-marine/90 via-marine/40 to-transparent" aria-hidden="true" />
          <div className="relative mt-auto">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Collection</p>
            <h2 className="mt-1 text-4xl font-extrabold text-white">HOCKEY</h2>
            <p className="mt-2 text-sm text-white/85">Patins · Crosses · Casques · Entraînement</p>
            <span className="btn mt-5 bg-white text-marine group-hover:bg-glacier">Voir la collection <span aria-hidden="true">→</span></span>
          </div>
        </Link>
      </section>

      <Section id="bloc-ski" eyebrow="Ski" title="Glisser plus loin" href="/categorie/skis" linkLabel="Tous les skis" products={home.ski} />
      <section className="relative isolate overflow-hidden bg-marine text-white" aria-labelledby="banniere-hockey">
        <HomeVisual name="hockeyBanner" position="75% center" />
        <div className="absolute inset-0 bg-gradient-to-r from-marine via-marine/75 to-transparent" aria-hidden="true" />
        <div className="container relative py-20 sm:py-24">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Hockey sur glace</p>
            <h2 id="banniere-hockey" className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Vitesse, contrôle, précision.
            </h2>
            <p className="mt-3 text-white/85">Patins, crosses et casques pour jouer à fond, de l’entraînement au match.</p>
            <Link href="/categorie/hockey" className="btn-accent mt-6">
              Découvrir le hockey <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Section id="bloc-hockey" eyebrow="Hockey sur glace" title="Équipé pour la glace" href="/categorie/hockey" linkLabel="Tout le hockey" products={home.hockey} />
      <Section id="bloc-accessoires" eyebrow="Accessoires" title="Les essentiels de la montagne" href="/categorie/accessoires" linkLabel="Tous les accessoires" products={home.accessories} />
      <Section id="nouveautes" eyebrow="Saison 2026/2027" title="Nouveautés" href="/catalogue?sort=newest" linkLabel="Voir les nouveautés" products={home.newest} />

      <section aria-labelledby="avantages" className="bg-snow py-14">
        <div className="container">
          <h2 id="avantages" className="sr-only">
            Pourquoi GLACIORA
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANTAGES.map((a, index) => (
              <li key={a.title}>
                <Reveal delay={index * 80} className="flex gap-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A6FAD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d={a.icon} />
                  </svg>
                  <div>
                    <h3 className="text-base font-bold">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted">{a.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="contact" className="relative isolate overflow-hidden bg-marine py-16 text-white">
        <HomeVisual name="essentials" />
        <div className="absolute inset-0 bg-marine/80" aria-hidden="true" />
        <div className="container relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-brand text-glacier">Une question ?</p>
            <h2 id="contact" className="mt-2 text-3xl font-extrabold text-white">
              Parlons de votre prochaine sortie
            </h2>
            <p className="mt-3 max-w-md text-white/85">Taille de ski, flex de chaussure, choix d’un patin : nous vous répondons par e-mail, téléphone ou WhatsApp.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            <li>
              <a href={`tel:${BRAND.phoneE164}`} className="btn-accent w-full">
                Appeler
              </a>
            </li>
            <li>
              <a href={BRAND.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-light w-full">
                WhatsApp<span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="btn-ghost-light w-full">
                E-mail
              </a>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
