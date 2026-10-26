import type { Metadata } from 'next';
import { BRAND } from '@glaciora/shared';

export const metadata: Metadata = {
  title: 'Conditions de vente',
  description: 'Conditions de vente GLACIORA : commande, paiement par virement bancaire, livraison en Europe.',
  alternates: { canonical: '/conditions-de-vente' },
};

/**
 * Seules les règles réellement appliquées par le site sont décrites ici.
 * Le texte juridique complet (rétractation, garanties, retours, litiges) doit être fourni par GLACIORA.
 */
export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl sm:text-4xl">Conditions de vente</h1>
      <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-warning">
        À compléter par GLACIORA : droit de rétractation, garanties légales, retours et remboursements, médiation. Seul le fonctionnement technique de la commande est décrit ci-dessous.
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl">Commande</h2>
          <p className="mt-2">La commande est enregistrée lorsque le client valide le formulaire et dépose la confirmation de son virement. Elle prend le statut « en attente de vérification du paiement ».</p>
        </section>
        <section>
          <h2 className="text-xl">Prix et paiement</h2>
          <p className="mt-2">Les prix sont indiqués en euros, toutes taxes comprises. Le paiement s’effectue par virement bancaire SEPA, en indiquant la référence de commande. Le paiement par carte bancaire est indisponible pour le moment.</p>
        </section>
        <section>
          <h2 className="text-xl">Préparation et livraison</h2>
          <p className="mt-2">La commande est préparée après vérification de la réception du virement. Les pays desservis, les frais et délais de livraison sont indiqués au moment de la commande. Un numéro de suivi est communiqué à l’expédition.</p>
        </section>
        <section>
          <h2 className="text-xl">Contact</h2>
          <p className="mt-2">
            {BRAND.email} · {BRAND.phoneDisplay} · {BRAND.postalCode} {BRAND.addressLocality}, {BRAND.addressRegion}
          </p>
        </section>
      </div>
    </div>
  );
}
