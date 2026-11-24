import type { LegalDocs } from './types';

const fr: LegalDocs = {
  terms: {
    version: 'Version en vigueur au 24 novembre 2026',
    intro: [
      'Les présentes conditions générales de vente (les « Conditions ») s’appliquent à toute commande passée sur le site {site} (la « Boutique »), exploité sous la marque {brand}.',
    ],
    sections: [
      {
        title: '1. Vendeur',
        paragraphs: [
          'La Boutique est exploitée par {seller}, entrepreneur individuel ({legalForm}), immatriculation : {registration}, adresse : {address} (le « Vendeur »).',
          'Contact : e-mail {email}, téléphone et WhatsApp {phone}. Ces coordonnées servent aussi aux réclamations et à l’exercice du droit de rétractation.',
        ],
      },
      {
        title: '2. Champ d’application et acceptation',
        paragraphs: [
          'Les Conditions régissent les ventes à distance conclues sur la Boutique entre le Vendeur et ses clients. Elles sont accessibles à tout moment depuis le pied de page et peuvent être enregistrées ou imprimées.',
          'Le client accepte les Conditions en cochant la case prévue avant de valider sa commande. Les Conditions applicables sont celles en vigueur à la date de la commande.',
          'Conformément au droit polonais, la personne physique qui achète pour les besoins de son activité professionnelle, lorsque l’achat ne revêt pas pour elle un caractère professionnel, bénéficie des mêmes règles que le consommateur en matière de droit de rétractation, de clauses abusives et de conformité des biens.',
        ],
      },
      {
        title: '3. Articles',
        paragraphs: [
          'La Boutique propose des équipements de ski, de hockey sur glace et de sports de neige de grandes marques. Les caractéristiques essentielles de chaque article (marque, modèle, tailles, coloris, état neuf ou d’occasion, spécifications) figurent sur sa fiche produit.',
          'Les photos présentent l’article et ses coloris aussi fidèlement que possible ; la teinte perçue peut varier selon l’écran. Les caractéristiques écrites de la fiche font foi.',
          'Les offres sont valables dans la limite des stocks disponibles. Si un article commandé se révèle indisponible, le client en est informé sans délai et remboursé des sommes versées pour cet article au plus tard dans les 14 jours.',
          'Un pack regroupe plusieurs articles à un prix réduit indiqué sur sa page. Chaque article d’un pack reste soumis aux présentes Conditions ; en cas de rétractation portant sur une partie seulement d’un pack, le remboursement correspond au prix de l’article renvoyé après application de la remise du pack.',
        ],
      },
      {
        title: '4. Prix',
        paragraphs: [
          'Les prix sont indiqués en euros (EUR). Ce sont des prix finaux, taxes comprises le cas échéant. Les frais de livraison, qui dépendent du pays de livraison et du mode d’envoi choisi, s’ajoutent au prix des articles et sont affichés avant la validation de la commande. Le Vendeur ne facture aucun autre frais.',
          'Le prix applicable est celui affiché au moment de la validation de la commande. Les éventuels frais prélevés par la banque du client pour l’émission d’un virement ou une conversion de devise restent à sa charge.',
        ],
      },
      {
        title: '5. Commande',
        paragraphs: ['La commande se déroule ainsi :'],
        list: [
          'choix des articles, de la taille et du coloris, puis ajout au panier ;',
          'saisie de l’adresse e-mail et de l’adresse de livraison, choix du mode de livraison ;',
          'choix du moyen de paiement et vérification du récapitulatif (articles, prix, frais de livraison, total à payer) ;',
          'acceptation des Conditions et validation de la commande, qui entraîne une obligation de paiement.',
        ],
        after: [
          'Avant de valider, le client peut revenir aux étapes précédentes pour vérifier et corriger les informations saisies. La commande peut être passée avec ou sans compte client.',
          'Le contrat de vente est conclu à l’envoi par le Vendeur de l’e-mail de confirmation de commande, qui récapitule la commande et contient un lien de suivi.',
          'Le Vendeur peut refuser une commande anormale ou une commande dont la preuve de paiement est inexacte ; le client en est informé et toute somme versée lui est remboursée.',
        ],
      },
      {
        title: '6. Paiement',
        paragraphs: ['Le prix est payable en totalité à la commande, par l’un des moyens proposés à l’étape de paiement :'],
        list: [
          'Virement bancaire SEPA : le client vire le montant exact, avec la référence de commande affichée, sur le compte bancaire indiqué à l’étape de paiement, puis dépose la preuve de son virement (reçu PDF ou image) avant de valider. La référence et le montant de la preuve sont vérifiés automatiquement. La commande est expédiée après réception effective des fonds sur le compte du Vendeur.',
          'Carte bancaire : lorsque ce moyen est proposé, le paiement est traité par Mollie B.V. (Amsterdam, Pays-Bas), établissement de paiement agréé et contrôlé par la banque centrale des Pays-Bas (De Nederlandsche Bank). Les données de la carte sont saisies sur l’interface sécurisée de Mollie ; elles ne sont jamais transmises au Vendeur ni conservées par lui. Selon la banque du client, une authentification forte (3-D Secure) peut être demandée. Le compte est débité à la validation de la commande.',
        ],
        after: [
          'Si le virement n’est pas crédité sur le compte du Vendeur dans les 7 jours suivant la commande, ou si la preuve de paiement se révèle inexacte, la commande est annulée et le client en est informé par e-mail.',
          'Tout remboursement est effectué sans frais pour le client, par le moyen de paiement utilisé pour la commande (virement sur le compte du client ou recrédit de la carte), sauf accord exprès du client pour un autre moyen.',
        ],
      },
      {
        title: '7. Livraison',
        paragraphs: [
          'Les articles sont livrés dans les pays européens proposés lors de la commande, à l’adresse indiquée par le client. Les modes de livraison disponibles et leurs tarifs sont affichés avant la validation.',
          'Sauf délai plus court indiqué lors de la commande, les articles sont livrés au plus tard 30 jours après la confirmation du paiement. À défaut, le client peut fixer au Vendeur un délai supplémentaire raisonnable ; si la livraison n’intervient pas dans ce délai, il peut résoudre le contrat et obtenir le remboursement de toutes les sommes versées.',
          'Le client suit sa commande depuis son espace client ou depuis le lien de suivi : « En préparation », « En route » puis « Livrée », chaque étape étant annoncée par e-mail.',
          'Le risque de perte ou d’endommagement des articles est transféré au client lorsque celui-ci, ou un tiers qu’il a désigné autre que le transporteur, en prend physiquement possession.',
          'Le client est invité à vérifier le colis à la livraison et à signaler toute anomalie (colis endommagé, article manquant) au transporteur et au Vendeur à {email}. Cette vérification ne le prive d’aucun de ses droits légaux.',
        ],
      },
      {
        title: '8. Droit de rétractation',
        paragraphs: [
          'Le consommateur dispose d’un délai de 14 jours pour se rétracter du contrat, sans avoir à motiver sa décision et sans autres frais que ceux indiqués ci-dessous. Le délai court à compter du jour où le consommateur, ou un tiers qu’il a désigné autre que le transporteur, prend physiquement possession de l’article ; pour une commande de plusieurs articles livrés séparément, à compter de la réception du dernier article.',
          'Pour exercer ce droit, le consommateur informe le Vendeur de sa décision par une déclaration dénuée d’ambiguïté, envoyée par e-mail à {email} ou par courrier à {address}. Il peut utiliser le modèle de formulaire figurant en annexe, sans obligation. Il suffit que la déclaration soit envoyée avant l’expiration du délai. Le Vendeur accuse réception de la rétractation par e-mail.',
          'Le consommateur renvoie les articles sans retard excessif et au plus tard 14 jours après avoir communiqué sa décision, à l’adresse du Vendeur indiquée ci-dessus ou à l’adresse que le Vendeur lui communique en accusant réception de sa rétractation. Les frais directs de renvoi sont à la charge du consommateur.',
          'Le Vendeur rembourse tous les paiements reçus, y compris les frais de livraison initiaux (à l’exception des frais supplémentaires liés au choix d’un mode de livraison plus coûteux que le mode standard le moins cher proposé), au plus tard 14 jours après avoir été informé de la rétractation. Il peut différer le remboursement jusqu’à la réception des articles ou jusqu’à ce que le consommateur ait fourni une preuve de leur expédition, selon ce qui intervient en premier.',
          'La responsabilité du consommateur n’est engagée qu’à l’égard de la dépréciation des articles résultant de manipulations autres que celles nécessaires pour établir leur nature, leurs caractéristiques et leur bon fonctionnement (par exemple des skis utilisés sur la neige, des fixations montées ou des patins affûtés). Il est recommandé de renvoyer les articles dans leur emballage d’origine.',
          'Le droit de rétractation ne s’applique pas aux biens confectionnés selon les spécifications du consommateur ou nettement personnalisés, ni aux biens scellés ne pouvant être renvoyés pour des raisons de protection de la santé ou d’hygiène et qui ont été descellés après la livraison.',
        ],
      },
      {
        title: '9. Conformité des articles et réclamations',
        paragraphs: [
          'Le Vendeur est tenu de livrer des articles conformes au contrat. Il répond de tout défaut de conformité existant au moment de la livraison et apparu dans les deux ans qui suivent ; un défaut apparu dans ce délai est présumé avoir existé lors de la livraison, sauf preuve contraire. Ces règles s’appliquent aussi aux articles d’occasion.',
          'En cas de défaut de conformité, le consommateur peut demander la réparation ou le remplacement de l’article. Si la mise en conformité est impossible, n’intervient pas dans un délai raisonnable ou si le défaut est grave, il peut obtenir une réduction du prix ou, si le défaut n’est pas mineur, la résolution du contrat. Les frais de mise en conformité, renvoi de l’article compris, sont à la charge du Vendeur.',
          'Les réclamations sont adressées à {email} ou par courrier à {address}, avec la référence de commande, la description du défaut et, si possible, des photos. Le Vendeur y répond dans un délai de 14 jours ; à défaut de réponse dans ce délai, la réclamation est réputée acceptée, conformément au droit polonais.',
          'La garantie commerciale éventuellement accordée par le fabricant s’ajoute à ces droits légaux sans les limiter.',
        ],
      },
      {
        title: '10. Données personnelles',
        paragraphs: ['Les données personnelles du client sont traitées conformément à la politique de confidentialité de la Boutique, accessible depuis le pied de page.'],
      },
      {
        title: '11. Litiges et droit applicable',
        paragraphs: [
          'Toute réclamation peut être adressée au Vendeur à {email}. Le consommateur peut aussi recourir gratuitement à un mode de règlement extrajudiciaire des litiges : en Pologne, par exemple, l’inspection régionale du commerce (Wojewódzki Inspektorat Inspekcji Handlowej) ou un médiateur municipal ou de district des consommateurs (rzecznik konsumentów) ; pour un litige transfrontalier, le Centre européen des consommateurs de son pays (réseau ECC-Net). Le recours à ces procédures est volontaire pour les deux parties. Informations : uokik.gov.pl.',
          'Les Conditions sont soumises au droit polonais. Ce choix ne prive pas le consommateur de la protection que lui assurent les dispositions impératives de la loi du pays où il a sa résidence habituelle. Le consommateur peut saisir les juridictions de son pays de résidence ou celles du lieu de l’adresse du Vendeur.',
          'En cas de divergence entre les versions linguistiques des Conditions, l’interprétation la plus favorable au consommateur prévaut.',
        ],
      },
    ],
    annex: {
      title: 'Annexe — Modèle de formulaire de rétractation',
      note: '(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)',
      lines: [
        'À l’attention de {seller} ({brand}), {address}, e-mail : {email} :',
        'Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*) ci-dessous :',
        'Commandé le (*) / reçu le (*) : …',
        'Référence de la commande : …',
        'Nom du (des) consommateur(s) : …',
        'Adresse du (des) consommateur(s) : …',
        'Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) : …',
        'Date : …',
        '(*) Rayez la mention inutile.',
      ],
    },
  },

  privacy: {
    version: 'Version en vigueur au 24 novembre 2026',
    intro: [
      'Cette politique explique quelles données personnelles sont traitées lorsque vous utilisez le site {site} et achetez sur la boutique {brand}, dans quel but, pendant combien de temps et avec qui elles sont partagées, ainsi que les droits dont vous disposez au titre du règlement général sur la protection des données (RGPD).',
    ],
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          '{seller}, entrepreneur individuel ({legalForm}), immatriculation : {registration}, adresse : {address}.',
          'Pour toute question relative à vos données : {email}. Le responsable du traitement n’a pas désigné de délégué à la protection des données, cette désignation n’étant pas obligatoire pour son activité.',
        ],
      },
      {
        title: '2. Données traitées',
        list: [
          'Compte client : prénom, nom, adresse e-mail, mot de passe (enregistré uniquement sous forme d’empreinte Argon2id, jamais en clair), téléphone s’il est renseigné, langue préférée.',
          'Commande : nom, adresse e-mail, téléphone, adresse de livraison, articles commandés, montants, modes de livraison et de paiement, référence de commande et historique de suivi.',
          'Paiement par virement : la preuve de virement que vous déposez (reçu PDF ou image), qui peut faire apparaître le nom du titulaire et des éléments du compte bancaire.',
          'Paiement par carte : la carte est saisie chez Mollie ; nous recevons seulement le résultat du paiement et une référence de transaction, jamais le numéro de la carte.',
          'Échanges avec le service client : messages envoyés par e-mail ou par WhatsApp et leur contenu.',
          'Données techniques : adresse IP, type de navigateur, date et heure des connexions et événements de sécurité (tentatives de connexion), utilisés pour protéger le site.',
        ],
      },
      {
        title: '3. Finalités et bases légales',
        list: [
          'Créer et gérer votre compte, traiter et livrer vos commandes, vérifier votre paiement, vous envoyer les e-mails liés à la commande (confirmation, suivi), traiter rétractations, réclamations et remboursements : exécution du contrat (article 6, paragraphe 1, point b) du RGPD).',
          'Tenir la comptabilité et conserver les pièces justificatives : respect d’une obligation légale (article 6, paragraphe 1, point c)).',
          'Sécuriser le site et les comptes (limitation des tentatives de connexion, prévention de la fraude et des fausses preuves de paiement), constater et défendre nos droits : intérêt légitime (article 6, paragraphe 1, point f)).',
          'Répondre à vos messages : mesures précontractuelles ou exécution du contrat lorsque le message concerne une commande, intérêt légitime dans les autres cas.',
        ],
        after: [
          'Nous n’envoyons ni lettre d’information ni publicité par e-mail, et nous ne vendons ni ne louons vos données. Les données signalées comme obligatoires sont nécessaires pour conclure le contrat ; sans elles, la commande ne peut pas être traitée.',
        ],
      },
      {
        title: '4. Vérification automatique des preuves de virement',
        paragraphs: [
          'Lorsque vous déposez une preuve de virement, un programme la lit sur nos propres serveurs, sans service externe, et vérifie uniquement que la référence de commande et le montant exact y figurent. Si la vérification échoue, la commande n’est pas enregistrée : vous pouvez déposer un autre document ou nous écrire à {email} pour qu’une personne examine votre paiement. Aucune autre décision automatisée ni aucun profilage n’est réalisé.',
        ],
      },
      {
        title: '5. Destinataires et prestataires',
        paragraphs: [
          'Vos données ne sont accessibles qu’aux personnes chargées de la boutique. Elles sont transmises uniquement aux prestataires nécessaires à son fonctionnement, qui agissent sur nos instructions :',
        ],
        list: [
          'Vercel Inc. (États-Unis) : hébergement du site web ;',
          'Railway Corporation (États-Unis) : hébergement de l’application et de la base de données ;',
          'Cloudflare, Inc. (États-Unis) : stockage privé et chiffré des preuves de virement (service R2) ;',
          'Sendinblue SAS, marque Brevo (France) : envoi des e-mails de commande et de compte ;',
          'Microsoft (Outlook.com) : messagerie du service client ;',
          'Mollie B.V. (Pays-Bas) : traitement des paiements par carte ; pour ses propres obligations (lutte contre la fraude et le blanchiment), Mollie agit en tant que responsable de traitement indépendant, selon sa propre politique de confidentialité ;',
          'le transporteur chargé de la livraison : nom, adresse de livraison, téléphone et e-mail, pour acheminer le colis ;',
          'WhatsApp Ireland Ltd, lorsque vous choisissez de nous écrire sur WhatsApp, selon les conditions de ce service ;',
          'les banques concernées par le paiement et, lorsque la loi l’exige, les autorités publiques.',
        ],
      },
      {
        title: '6. Transferts hors de l’Espace économique européen',
        paragraphs: [
          'Certains prestataires sont établis aux États-Unis (Vercel, Railway, Cloudflare, Microsoft). Ces transferts reposent sur la décision d’adéquation de la Commission européenne relative au cadre de protection des données UE–États-Unis (Data Privacy Framework) lorsque le prestataire y est certifié, et à défaut sur les clauses contractuelles types adoptées par la Commission européenne. Vous pouvez en obtenir une copie en écrivant à {email}.',
        ],
      },
      {
        title: '7. Durées de conservation',
        list: [
          'Compte : jusqu’à sa suppression, que vous pouvez demander à tout moment à {email}. Les commandes associées restent conservées pendant la durée légale indiquée ci-dessous.',
          'Commandes et pièces comptables : pendant la durée imposée par la législation fiscale et comptable polonaise, en principe 5 ans à compter de la fin de l’année concernée.',
          'Preuves de virement : supprimées automatiquement 400 jours après leur dépôt.',
          'Messages au service client : le temps nécessaire au traitement de la demande puis, le cas échéant, jusqu’à l’expiration des délais de prescription.',
          'Données techniques et de sécurité : le temps nécessaire à la sécurité du site, puis supprimées.',
        ],
      },
      {
        title: '8. Cookies et stockage dans le navigateur',
        paragraphs: [
          'Le site utilise uniquement des cookies nécessaires à son fonctionnement. Aucun cookie publicitaire, de mesure d’audience ou de réseau social n’est déposé ; c’est pourquoi aucun consentement n’est demandé.',
        ],
        list: [
          'glaciora_lang : langue choisie (1 an) ;',
          'glaciora_cart : contenu du panier (30 jours) ;',
          'glaciora_at et glaciora_rt : connexion à votre compte (15 minutes et 30 jours) ;',
          'glaciora_ref : référence de virement pendant la commande (3 heures) ;',
          'glaciora_order : accès au suivi de la commande que vous venez de passer (30 jours).',
        ],
        after: [
          'Pendant la commande, les informations saisies sont gardées dans le stockage de session du navigateur, effacé à la fermeture de l’onglet ou une fois la commande passée. La vitesse d’affichage des pages est mesurée de façon anonyme par Vercel Speed Insights, sans cookie.',
        ],
      },
      {
        title: '9. Sécurité',
        paragraphs: [
          'Les échanges avec le site sont chiffrés (HTTPS). Les mots de passe sont stockés sous forme d’empreinte Argon2id, les cookies de connexion sont inaccessibles aux scripts de la page, et un compte est verrouillé temporairement après 5 tentatives de connexion infructueuses. Les preuves de virement sont stockées de façon privée et ne sont consultables que par les administrateurs de la boutique.',
        ],
      },
      {
        title: '10. Vos droits',
        paragraphs: [
          'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation du traitement et de portabilité de vos données, ainsi que d’un droit d’opposition aux traitements fondés sur l’intérêt légitime. Pour les exercer, écrivez à {email} ; nous répondons dans un délai d’un mois. Une preuve d’identité peut être demandée en cas de doute raisonnable.',
          'Vous pouvez introduire une réclamation auprès de l’autorité polonaise de protection des données, le Prezes Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Varsovie, uodo.gov.pl), ou auprès de l’autorité de protection des données de votre pays de résidence.',
        ],
      },
      {
        title: '11. Mineurs',
        paragraphs: ['La boutique s’adresse aux adultes. Les articles pour enfants sont destinés à être achetés par un adulte ; nous ne collectons pas sciemment de données concernant des enfants.'],
      },
      {
        title: '12. Modifications',
        paragraphs: ['Cette politique peut être mise à jour, notamment lors de l’arrivée d’un nouveau prestataire. La date de la version en vigueur figure en haut de la page.'],
      },
    ],
  },
};

export default fr;
