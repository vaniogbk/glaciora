import Image from 'next/image';
import { BRAND } from '@glaciora/shared/contact';
import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import type { Messages } from '@/i18n/messages';

/** Passe à « true » (NEXT_PUBLIC_CARD_PAYMENT_ENABLED) quand le paiement par carte sera branché : la mention « bientôt disponible » disparaît. */
const CARD_PAYMENT_ENABLED = process.env.NEXT_PUBLIC_CARD_PAYMENT_ENABLED === 'true';

/** Pied de page rendu sur le serveur (aucun JavaScript envoyé au navigateur pour lui). */
export function Footer({ m }: { locale: Locale; m: Messages }) {
  const f = m.footer;
  const year = new Date().getFullYear();
  return (
    <footer className="bg-marine text-white" aria-labelledby="pied-de-page">
      <h2 id="pied-de-page" className="sr-only">
        {f.heading}
      </h2>
      <div className="container grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/brand/logo-horizontal-slogan-sombre.svg" alt={f.logoAlt} width={220} height={45} className="h-auto w-[220px]" />
          <p className="mt-4 max-w-xs text-sm text-white/80">{f.tagline}</p>
        </div>
        <nav aria-label={f.departments}>
          <h3 className="text-sm font-bold uppercase tracking-brand text-glacier">{f.departments}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-glacier" href="/categorie/skis">{m.nav.skis}</Link></li>
            <li><Link className="hover:text-glacier" href="/categorie/bottes">{f.skiBoots}</Link></li>
            <li><Link className="hover:text-glacier" href="/categorie/hockey">{f.iceHockey}</Link></li>
            <li><Link className="hover:text-glacier" href="/categorie/accessoires">{m.nav.accessories}</Link></li>
            <li><Link className="hover:text-glacier" href="/catalogue">{m.nav.all}</Link></li>
          </ul>
        </nav>
        <nav aria-label={f.customerService}>
          <h3 className="text-sm font-bold uppercase tracking-brand text-glacier">{f.customerService}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-glacier" href="/compte">{f.myAccount}</Link></li>
            <li><Link className="hover:text-glacier" href="/compte/commandes">{f.trackOrder}</Link></li>
            <li><Link className="hover:text-glacier" href="/conditions-de-vente">{f.terms}</Link></li>
            <li className="text-white/80">{CARD_PAYMENT_ENABLED ? f.payCard : f.payCardSoon}</li>
            <li className="text-white/80">{f.payTransfer}</li>
          </ul>
        </nav>
        <address className="not-italic">
          <h3 className="text-sm font-bold uppercase tracking-brand text-glacier">{f.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a className="hover:text-glacier" href={`mailto:${BRAND.email}`}>
                {BRAND.email}
              </a>
            </li>
            <li>
              <a className="hover:text-glacier" href={`tel:${BRAND.phoneE164}`} aria-label={f.call.replace('{phone}', BRAND.phoneDisplay)}>
                {BRAND.phoneDisplay}
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-glacier" href={BRAND.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
                </svg>
                WhatsApp
                <span className="sr-only">{m.common.newWindow}</span>
              </a>
            </li>
            <li>
              {BRAND.streetAddress}, {BRAND.postalCode} {BRAND.addressLocality}
            </li>
          </ul>
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="container py-5 text-xs text-white/70">
          © {year} GLACIORA · Born for ice. Made for adventure.
        </p>
      </div>
    </footer>
  );
}
