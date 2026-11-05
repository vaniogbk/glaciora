import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@glaciora/shared/contact';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Conditions générales de vente GLACIORA : commande, paiement par virement bancaire, livraison en Europe, rétractation et garanties.',
  alternates: { canonical: '/conditions-de-vente' },
};

/** Mention que seul GLACIORA peut fournir (identité légale, choix commerciaux) : surlignée tant qu'elle n'est pas remplie. */
function ToFill({ children }: { children: ReactNode }) {
  return <mark className="rounded-sm bg-warning/20 px-1 font-semibold text-marine">[À compléter : {children}]</mark>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

/**
 * Modèle de CGV de vente à distance aux consommateurs (droit français, clients de l'UE), aligné sur le fonctionnement réel
 * du site : virement SEPA avec preuve, suivi en 3 étapes, conservation des preuves (PROOF_RETENTION_DAYS, 400 jours par défaut).
 * Les mentions surlignées dépendent de GLACIORA ; le texte est à faire valider avant usage.
 */
export default function TermsPage() {
  const address = `${BRAND.streetAddress}, ${BRAND.postalCode} ${BRAND.addressLocality}, France`;
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl sm:text-4xl">Conditions générales de vente</h1>
      <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-warning">
        Projet de conditions générales : les mentions surlignées sont à compléter par GLACIORA, et l’ensemble est à faire valider avant usage.
      </p>
      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <Section title="1. Vendeur et champ d’application">
          <p>
            Les présentes conditions régissent les ventes conclues sur ce site entre {BRAND.name} et tout client consommateur. Vendeur : <ToFill>raison sociale ou nom de l’entrepreneur</ToFill>, <ToFill>forme juridique</ToFill>, SIRET <ToFill>numéro</ToFill>, <ToFill>n° de TVA intracommunautaire ou mention « TVA non applicable, art. 293 B du CGI »</ToFill>, {address}. Contact : {BRAND.email} · {BRAND.phoneDisplay} (téléphone et WhatsApp).
          </p>
          <p>Toute commande vaut acceptation des conditions en vigueur au jour de la commande, que le client accepte en cochant la case prévue avant de valider.</p>
        </Section>

        <Section title="2. Produits">
          <p>Les caractéristiques essentielles (modèle, taille, état neuf ou d’occasion, spécifications) figurent sur chaque fiche produit. Les photos présentent les articles et leurs coloris à titre indicatif et n’ont pas de valeur contractuelle ; seules les caractéristiques écrites de la fiche font foi. Les offres valent dans la limite des stocks affichés.</p>
        </Section>

        <Section title="3. Prix">
          <p>Les prix sont indiqués en euros, toutes taxes applicables comprises, hors frais de livraison. Les frais de livraison du pays choisi sont affichés avant la validation de la commande. Le prix facturé est celui affiché au moment de la commande.</p>
        </Section>

        <Section title="4. Commande et suivi">
          <p>
            Le client choisit ses articles, indique son adresse et son mode de livraison, affiche les coordonnées bancaires et la référence de virement, effectue le virement puis dépose sa preuve de virement (reçu PDF ou photo) avant de valider. La commande est alors enregistrée et confirmée par e-mail, avec un lien de suivi.
          </p>
          <p>Suivi en trois étapes, chacune annoncée par e-mail : « En préparation » dès la validation, « En route » une fois le virement crédité et le colis expédié, « Livrée » à la réception.</p>
        </Section>

        <Section title="5. Paiement">
          <p>
            Le paiement s’effectue par virement bancaire SEPA, du montant exact et avec la référence de commande indiquée. Le paiement par carte bancaire est indisponible pour le moment. La commande n’est expédiée qu’après réception effective du virement. À défaut de virement reçu sous <ToFill>délai, par exemple 7 jours</ToFill>, la commande peut être annulée et les articles remis en vente. Une preuve de virement inexacte entraîne l’annulation de la commande.
          </p>
        </Section>

        <Section title="6. Livraison">
          <p>
            Les pays desservis, transporteurs, tarifs et délais indicatifs sont indiqués lors de la commande. La livraison intervient au plus tard dans un délai de <ToFill>délai maximal, par exemple 30 jours</ToFill> après réception du paiement. Le risque de perte ou d’endommagement est transféré au client lorsqu’il prend physiquement possession des articles (article L216-4 du Code de la consommation). En cas de retard, le client peut, après mise en demeure restée sans effet, résoudre le contrat dans les conditions des articles L216-6 et suivants.
          </p>
          <p>Le client vérifie le colis à réception et signale au transporteur et à {BRAND.email} toute anomalie (colis endommagé, articles manquants).</p>
        </Section>

        <Section title="7. Droit de rétractation">
          <p>
            Le client dispose de quatorze jours à compter de la réception des articles pour se rétracter, sans avoir à se justifier (articles L221-18 et suivants du Code de la consommation), en adressant à {BRAND.email} une déclaration dénuée d’ambiguïté ou le formulaire ci-dessous. Il renvoie les articles au plus tard quatorze jours après avoir communiqué sa décision, à l’adresse <ToFill>adresse de retour</ToFill>, complets, dans leur état d’origine et dans un emballage permettant un transport sans dommage. Les frais de retour sont à la charge du client <ToFill>à confirmer, ou pris en charge par GLACIORA</ToFill>.
          </p>
          <p>
            GLACIORA rembourse la totalité des sommes versées, frais de livraison initiaux compris (sur la base du mode de livraison le moins coûteux proposé), au plus tard quatorze jours après avoir été informé de la rétractation, par virement sur le compte du client. Le remboursement peut être différé jusqu’à la récupération des articles ou la preuve de leur expédition. La responsabilité du client peut être engagée en cas de dépréciation des articles résultant de manipulations autres que celles nécessaires pour établir leur nature et leurs caractéristiques (par exemple des skis montés ou utilisés).
          </p>
        </Section>

        <Section title="8. Garanties légales">
          <p>
            Tous les articles bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil). En cas de défaut de conformité apparu dans les deux ans suivant la livraison, le client peut obtenir la réparation ou le remplacement de l’article, ou à défaut une réduction du prix ou la résolution du contrat ; ce défaut est présumé exister au moment de la livraison. Pour les articles d’occasion, la durée de la garantie de conformité est de <ToFill>12 ou 24 mois, à préciser</ToFill>. En cas de vice caché, le client agit dans les deux ans de la découverte du vice.
          </p>
          <p>Pour toute demande au titre des garanties : {BRAND.email}, en précisant la référence de commande et le défaut constaté.</p>
        </Section>

        <Section title="9. Données personnelles">
          <p>
            Les données saisies lors de la commande (identité, coordonnées, adresse, preuve de virement) servent à traiter la commande, à vérifier le paiement, à livrer et à suivre la relation client. Elles ne sont ni vendues ni cédées. Les preuves de virement sont stockées de façon privée, accessibles aux seuls administrateurs, et supprimées automatiquement après 400 jours. Le client peut exercer ses droits d’accès, de rectification, d’effacement et d’opposition en écrivant à {BRAND.email}, et saisir la CNIL (cnil.fr) s’il estime ses droits non respectés.
          </p>
        </Section>

        <Section title="10. Médiation et droit applicable">
          <p>
            En cas de litige, le client s’adresse d’abord à {BRAND.email}. À défaut de solution amiable, il peut recourir gratuitement au médiateur de la consommation : <ToFill>nom, site internet et adresse du médiateur auquel GLACIORA adhère</ToFill> (articles L612-1 et suivants du Code de la consommation). Les présentes conditions sont soumises au droit français, sans priver le client résidant dans un autre pays de l’Union européenne des dispositions impératives protectrices de son pays de résidence.
          </p>
        </Section>

        <Section title="Annexe — Formulaire de rétractation">
          <div className="rounded-md bg-snow p-4">
            <p>À l’attention de {BRAND.name}, {address}, {BRAND.email} :</p>
            <p>Je vous notifie par la présente ma rétractation du contrat portant sur la vente des articles ci-dessous :</p>
            <p>Commandé le / reçu le : … · Référence de commande : … · Articles : …</p>
            <p>Nom et adresse du client : … · Date : … · Signature (en cas d’envoi papier) : …</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
