# GLACIORA — suivi de l'extension du catalogue

Une ligne par produit. Données vérifiées = existence du modèle, prix, tailles et coloris relevés sur la page source
(revendeur), à la date indiquée dans `apps/api/data/catalogue-extension.csv`. Un produit n'est importé que lorsque
son image existe dans `GLACIORA_EXTENSION/` ; il reste en brouillon tant que son statut n'est pas « terminé ».

Prix : prix de vente constaté chez le revendeur source (Glisshop) le 2026-11-23, sans prix barré.
Le prix conseillé fabricant est conservé à titre d'information (`msrp_eur`).
Tailles : seulement celles disponibles chez le revendeur à cette date.

## Lot 1 — Vêtements de ski

| Réf. | Produit | Marque | Catégorie | Données vérifiées | Prompt Gemini | Image générée | Intégré au site | Statut |
|---|---|---|---|---|---|---|---|---|
| GLA-040 | Hero Insulated, veste homme, noir — 344,90 € | Rossignol | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-041 | Object, veste homme, Vapor Grey — 296,90 € | Picture Organic Clothing | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-042 | Parker, veste homme, noir — 156,90 € | Picture Organic Clothing | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-043 | Exa, veste femme, noir — 296,90 € | Picture Organic Clothing | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-044 | Staci Insulated, veste femme, noir — 254,90 € | Rossignol | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-045 | Hero Insulated, pantalon homme, noir — 190,90 € | Rossignol | Pantalons de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-046 | Insulated Ski Pant, pantalon homme, noir — 149,90 € | Rossignol | Pantalons de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-047 | W's Insulated, pantalon femme, noir — 149,90 € | Rossignol | Pantalons de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-048 | Exa, pantalon femme, noir — 149,90 € | Picture Organic Clothing | Pantalons de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-049 | Snowy Toddler, combinaison enfant 3–5 ans — 118,90 € | Picture Organic Clothing | Combinaisons de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-050 | Daumy, veste enfant 12–14 ans — 118,90 € | Picture Organic Clothing | Vestes de ski | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-051 | Active Warm Eco, haut thermique — 48,50 € | Odlo | Sous-vêtements thermiques | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-052 | Active Warm Eco, collant thermique — 44,90 € | Odlo | Sous-vêtements thermiques | Oui (Glisshop) | Oui | Non | Non | à vérifier |
| GLA-053 | Park Zip Tech, polaire — 105,90 € | Picture Organic Clothing | Polaires | Oui (Glisshop) | Oui | Non | Non | à vérifier |

## Lots suivants (à faire)

2. Équipements et vêtements de hockey sur glace — 3. Hockey sur gazon — 4. Lunettes et masques —
5. Gants et accessoires d'hiver — 6. Chaussures de sport — 7. Balles, ballons et palets — 8. Protections —
9. Sacs et transport. Packs (ski complet, hockey complet) : voir le rapport.

## Reprise

1. Générer les images avec Gemini à partir de `GLACIORA_EXTENSION/PROMPTS_GEMINI_LOT1.md` (noms et dossiers exacts).
2. Contrôler chaque image contre la photo du lien « Source » ; passer le statut à `terminé` dans le CSV.
3. `npm run import:catalogue` (base locale + images), puis exporter l'instantané et l'installer en production
   depuis l'admin (« Import catalogue »).
