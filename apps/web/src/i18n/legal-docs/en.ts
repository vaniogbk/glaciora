import type { LegalDocs } from './types';

const en: LegalDocs = {
  terms: {
    version: 'Version in force as of 24 November 2026',
    intro: [
      'These general terms and conditions of sale (the “Terms”) apply to every order placed on the website {site} (the “Shop”), operated under the brand {brand}.',
    ],
    sections: [
      {
        title: '1. Seller',
        paragraphs: [
          'The Shop is operated by {seller}, sole trader ({legalForm}), registration: {registration}, address: {address} (the “Seller”).',
          'Contact: email {email}, phone and WhatsApp {phone}. These details may also be used for complaints and to exercise the right of withdrawal.',
        ],
      },
      {
        title: '2. Scope and acceptance',
        paragraphs: [
          'These Terms govern distance sales concluded on the Shop between the Seller and its customers. They can be accessed at any time from the footer and can be saved or printed.',
          'The customer accepts these Terms by ticking the box provided before confirming the order. The Terms that apply are those in force on the date of the order.',
          'Under Polish law, a natural person who buys for the purposes of their business, where the purchase is not of a professional nature for them, benefits from the same rules as a consumer regarding the right of withdrawal, unfair terms and the conformity of goods.',
        ],
      },
      {
        title: '3. Products',
        paragraphs: [
          'The Shop offers ski, ice hockey and snow sports equipment from major brands. The main characteristics of each item (brand, model, sizes, colours, new or used condition, specifications) are shown on its product page.',
          'Photos show the item and its colours as faithfully as possible; the perceived shade may vary depending on the screen. The written characteristics on the product page prevail.',
          'Offers are valid while stocks last. If an ordered item turns out to be unavailable, the customer is informed without delay and refunded the amounts paid for that item within 14 days at the latest.',
          'A pack groups several items at the reduced price shown on its page. Each item in a pack remains subject to these Terms; if the withdrawal concerns only part of a pack, the refund corresponds to the price of the returned item after applying the pack discount.',
        ],
      },
      {
        title: '4. Prices',
        paragraphs: [
          'Prices are shown in euros (EUR). They are final prices, including taxes where applicable. Delivery costs, which depend on the delivery country and the shipping method chosen, are added to the price of the items and shown before the order is confirmed. The Seller charges no other fees.',
          'The applicable price is the one displayed when the order is confirmed. Any fees charged by the customer’s bank for sending a transfer or for currency conversion are borne by the customer.',
        ],
      },
      {
        title: '5. Ordering',
        paragraphs: ['An order is placed as follows:'],
        list: [
          'choose the items, size and colour, then add them to the cart;',
          'enter the email address and delivery address, and choose the shipping method;',
          'choose the payment method and check the summary (items, prices, delivery costs, total to pay);',
          'accept these Terms and confirm the order, which entails an obligation to pay.',
        ],
        after: [
          'Before confirming, the customer can go back to the previous steps to check and correct the information entered. Orders can be placed with or without a customer account.',
          'The sales contract is concluded when the Seller sends the order confirmation email, which summarises the order and contains a tracking link.',
          'The Seller may refuse an abnormal order or an order whose proof of payment is inaccurate; the customer is informed and any amount paid is refunded.',
        ],
      },
      {
        title: '6. Payment',
        paragraphs: ['The price is payable in full when ordering, by one of the methods offered at the payment step:'],
        list: [
          'SEPA bank transfer: the customer transfers the exact amount, with the order reference displayed, to the bank account shown at the payment step, then uploads proof of the transfer (PDF receipt or image) before confirming. The reference and amount on the proof are checked automatically. The order is shipped once the funds have actually been received in the Seller’s account.',
          'Card payment: where this method is offered, the payment is processed by Mollie B.V. (Amsterdam, Netherlands), a licensed payment institution supervised by the Dutch central bank (De Nederlandsche Bank). Card details are entered on Mollie’s secure interface; they are never transmitted to or stored by the Seller. Depending on the customer’s bank, strong customer authentication (3-D Secure) may be required. The account is charged when the order is confirmed.',
        ],
        after: [
          'If the transfer is not credited to the Seller’s account within 7 days of the order, or if the proof of payment proves to be inaccurate, the order is cancelled and the customer is informed by email.',
          'Any refund is made free of charge for the customer, using the payment method used for the order (transfer to the customer’s account or credit to the card), unless the customer expressly agrees to another method.',
        ],
      },
      {
        title: '7. Delivery',
        paragraphs: [
          'Items are delivered to the European countries offered when ordering, at the address given by the customer. The available shipping methods and their prices are shown before the order is confirmed.',
          'Unless a shorter time is stated when ordering, items are delivered no later than 30 days after the payment is confirmed. If not, the customer may set the Seller an additional reasonable period; if delivery does not take place within that period, the customer may terminate the contract and obtain a refund of all amounts paid.',
          'The customer can follow the order from their account or from the tracking link: “Being prepared”, “On its way”, then “Delivered”, each step being announced by email.',
          'The risk of loss of or damage to the items passes to the customer when the customer, or a third party indicated by the customer other than the carrier, takes physical possession of them.',
          'The customer is invited to check the parcel on delivery and to report any problem (damaged parcel, missing item) to the carrier and to the Seller at {email}. This check does not affect any of the customer’s statutory rights.',
        ],
      },
      {
        title: '8. Right of withdrawal',
        paragraphs: [
          'The consumer has 14 days to withdraw from the contract without giving any reason and without any costs other than those stated below. The period starts on the day the consumer, or a third party indicated by the consumer other than the carrier, takes physical possession of the item; for an order of several items delivered separately, on the day the last item is received.',
          'To exercise this right, the consumer informs the Seller of the decision by an unequivocal statement sent by email to {email} or by post to {address}. The consumer may use the model withdrawal form in the annex, but this is not obligatory. It is sufficient to send the statement before the withdrawal period expires. The Seller acknowledges receipt of the withdrawal by email.',
          'The consumer sends back the items without undue delay and no later than 14 days after communicating the decision, to the Seller’s address given above or to the address the Seller provides when acknowledging the withdrawal. The direct cost of returning the items is borne by the consumer.',
          'The Seller reimburses all payments received, including the initial delivery costs (except for any supplementary costs resulting from the choice of a delivery method more expensive than the least expensive standard delivery offered), no later than 14 days after being informed of the withdrawal. The Seller may withhold the reimbursement until the items have been received back or the consumer has supplied evidence of having sent them back, whichever is the earliest.',
          'The consumer is only liable for any diminished value of the items resulting from handling other than what is necessary to establish their nature, characteristics and functioning (for example skis used on snow, mounted bindings or sharpened skates). We recommend returning the items in their original packaging.',
          'The right of withdrawal does not apply to goods made to the consumer’s specifications or clearly personalised, nor to sealed goods which are not suitable for return due to health protection or hygiene reasons and were unsealed after delivery.',
        ],
      },
      {
        title: '9. Conformity of goods and complaints',
        paragraphs: [
          'The Seller must deliver goods that conform to the contract. The Seller is liable for any lack of conformity that exists at the time of delivery and becomes apparent within two years of it; a lack of conformity that becomes apparent within that period is presumed to have existed at delivery, unless proven otherwise. These rules also apply to used items.',
          'In the event of a lack of conformity, the consumer may request repair or replacement of the item. If bringing the item into conformity is impossible, is not done within a reasonable time, or the lack of conformity is serious, the consumer may obtain a price reduction or, if the lack of conformity is not minor, terminate the contract. The costs of bringing the item into conformity, including returning it, are borne by the Seller.',
          'Complaints are sent to {email} or by post to {address}, with the order reference, a description of the defect and, if possible, photos. The Seller responds within 14 days; if no response is given within that period, the complaint is deemed accepted, in accordance with Polish law.',
          'Any commercial guarantee offered by the manufacturer is in addition to these statutory rights and does not limit them.',
        ],
      },
      {
        title: '10. Personal data',
        paragraphs: ['The customer’s personal data are processed in accordance with the Shop’s privacy policy, available from the footer.'],
      },
      {
        title: '11. Disputes and applicable law',
        paragraphs: [
          'Any complaint can be sent to the Seller at {email}. The consumer may also use out-of-court dispute resolution free of charge: in Poland, for example, the regional trade inspectorate (Wojewódzki Inspektorat Inspekcji Handlowej) or a municipal or district consumer ombudsman (rzecznik konsumentów); for a cross-border dispute, the European Consumer Centre of their country (ECC-Net). Using these procedures is voluntary for both parties. Information: uokik.gov.pl.',
          'These Terms are governed by Polish law. This choice does not deprive the consumer of the protection afforded by the mandatory provisions of the law of the country of their habitual residence. The consumer may bring proceedings before the courts of their country of residence or those of the Seller’s address.',
          'In the event of any discrepancy between language versions of these Terms, the interpretation most favourable to the consumer prevails.',
        ],
      },
    ],
    annex: {
      title: 'Annex — Model withdrawal form',
      note: '(Complete and return this form only if you wish to withdraw from the contract.)',
      lines: [
        'To {seller} ({brand}), {address}, email: {email}:',
        'I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*):',
        'Ordered on (*) / received on (*): …',
        'Order reference: …',
        'Name of consumer(s): …',
        'Address of consumer(s): …',
        'Signature of consumer(s) (only if this form is notified on paper): …',
        'Date: …',
        '(*) Delete as appropriate.',
      ],
    },
  },

  privacy: {
    version: 'Version in force as of 24 November 2026',
    intro: [
      'This policy explains which personal data are processed when you use the website {site} and buy from the {brand} shop, for what purpose, for how long and with whom they are shared, as well as your rights under the General Data Protection Regulation (GDPR).',
    ],
    sections: [
      {
        title: '1. Data controller',
        paragraphs: [
          '{seller}, sole trader ({legalForm}), registration: {registration}, address: {address}.',
          'For any question about your data: {email}. The controller has not appointed a data protection officer, as this is not mandatory for its activity.',
        ],
      },
      {
        title: '2. Data processed',
        list: [
          'Customer account: first name, last name, email address, password (stored only as an Argon2id hash, never in plain text), phone number if provided, preferred language.',
          'Order: name, email address, phone number, delivery address, items ordered, amounts, shipping and payment methods, order reference and tracking history.',
          'Bank transfer payment: the proof of transfer you upload (PDF receipt or image), which may show the account holder’s name and bank account details.',
          'Card payment: the card is entered at Mollie; we only receive the payment result and a transaction reference, never the card number.',
          'Contacts with customer service: messages sent by email or WhatsApp and their content.',
          'Technical data: IP address, browser type, date and time of connections and security events (login attempts), used to protect the website.',
        ],
      },
      {
        title: '3. Purposes and legal bases',
        list: [
          'Creating and managing your account, processing and delivering your orders, verifying your payment, sending order-related emails (confirmation, tracking), handling withdrawals, complaints and refunds: performance of the contract (Article 6(1)(b) GDPR).',
          'Keeping accounts and supporting documents: compliance with a legal obligation (Article 6(1)(c)).',
          'Securing the website and accounts (limiting login attempts, preventing fraud and fake proofs of payment), establishing and defending our rights: legitimate interest (Article 6(1)(f)).',
          'Answering your messages: pre-contractual steps or performance of the contract when the message concerns an order, legitimate interest otherwise.',
        ],
        after: [
          'We do not send newsletters or advertising emails, and we do not sell or rent your data. Data marked as mandatory are necessary to conclude the contract; without them, the order cannot be processed.',
        ],
      },
      {
        title: '4. Automatic check of proofs of transfer',
        paragraphs: [
          'When you upload a proof of transfer, a program reads it on our own servers, without any external service, and only checks that the order reference and the exact amount appear on it. If the check fails, the order is not recorded: you can upload another document or write to {email} so that a person reviews your payment. No other automated decision-making or profiling takes place.',
        ],
      },
      {
        title: '5. Recipients and service providers',
        paragraphs: [
          'Your data are only accessible to the people running the shop. They are shared only with the service providers needed to operate it, who act on our instructions:',
        ],
        list: [
          'Vercel Inc. (United States): website hosting;',
          'Railway Corporation (United States): hosting of the application and database;',
          'Cloudflare, Inc. (United States): private, encrypted storage of proofs of transfer (R2 service);',
          'Sendinblue SAS, Brevo brand (France): sending order and account emails;',
          'Microsoft (Outlook.com): customer service mailbox;',
          'Mollie B.V. (Netherlands): processing card payments; for its own obligations (fraud and money-laundering prevention), Mollie acts as an independent controller under its own privacy policy;',
          'the carrier handling the delivery: name, delivery address, phone number and email, to deliver the parcel;',
          'WhatsApp Ireland Ltd, when you choose to write to us on WhatsApp, under that service’s terms;',
          'the banks involved in the payment and, where required by law, public authorities.',
        ],
      },
      {
        title: '6. Transfers outside the European Economic Area',
        paragraphs: [
          'Some service providers are based in the United States (Vercel, Railway, Cloudflare, Microsoft). These transfers rely on the European Commission’s adequacy decision for the EU–US Data Privacy Framework where the provider is certified, and otherwise on the standard contractual clauses adopted by the European Commission. You can obtain a copy by writing to {email}.',
        ],
      },
      {
        title: '7. Retention periods',
        list: [
          'Account: until it is deleted, which you can request at any time at {email}. Related orders are kept for the legal period below.',
          'Orders and accounting records: for the period required by Polish tax and accounting law, as a rule 5 years from the end of the year concerned.',
          'Proofs of transfer: deleted automatically 400 days after being uploaded.',
          'Messages to customer service: as long as needed to handle the request and then, where applicable, until the limitation periods expire.',
          'Technical and security data: as long as needed for the security of the website, then deleted.',
        ],
      },
      {
        title: '8. Cookies and browser storage',
        paragraphs: [
          'The website only uses cookies that are necessary for it to work. No advertising, analytics or social media cookies are set, which is why no consent is requested.',
        ],
        list: [
          'glaciora_lang: chosen language (1 year);',
          'glaciora_cart: cart contents (30 days);',
          'glaciora_at and glaciora_rt: signing in to your account (15 minutes and 30 days);',
          'glaciora_ref: transfer reference during checkout (3 hours);',
          'glaciora_order: access to tracking for the order you have just placed (30 days).',
        ],
        after: [
          'During checkout, the information entered is kept in the browser’s session storage, which is cleared when the tab is closed or once the order is placed. Page loading speed is measured anonymously by Vercel Speed Insights, without cookies.',
        ],
      },
      {
        title: '9. Security',
        paragraphs: [
          'Communications with the website are encrypted (HTTPS). Passwords are stored as Argon2id hashes, sign-in cookies cannot be read by page scripts, and an account is temporarily locked after 5 failed login attempts. Proofs of transfer are stored privately and can only be viewed by the shop’s administrators.',
        ],
      },
      {
        title: '10. Your rights',
        paragraphs: [
          'You have the right of access, rectification, erasure, restriction of processing and data portability, and the right to object to processing based on legitimate interest. To exercise them, write to {email}; we reply within one month. Proof of identity may be requested in case of reasonable doubt.',
          'You may lodge a complaint with the Polish data protection authority, the Prezes Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warsaw, uodo.gov.pl), or with the data protection authority of your country of residence.',
        ],
      },
      {
        title: '11. Minors',
        paragraphs: ['The shop is intended for adults. Children’s items are meant to be bought by an adult; we do not knowingly collect data about children.'],
      },
      {
        title: '12. Changes',
        paragraphs: ['This policy may be updated, in particular when a new service provider is added. The date of the version in force is shown at the top of the page.'],
      },
    ],
  },
};

export default en;
