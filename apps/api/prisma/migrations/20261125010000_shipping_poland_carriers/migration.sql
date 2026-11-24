-- Livraison au départ de la Pologne (Rumia), décision de la boutique du 2026-11-24 :
-- transporteurs réels affichés aux clients (Poczta Polska en standard, FedEx Express en express), tarifs inchangés ;
-- les 10 pays de l'UE encore désactivés sont ouverts avec les tarifs de la zone « Union européenne ».
UPDATE "ShippingRate" SET "name" = 'Poczta Polska' WHERE "name" IN ('Colissimo à domicile', 'Colissimo international', 'Colissimo international (zone A)', 'Colissimo international (zone B)');
UPDATE "ShippingRate" SET "name" = 'FedEx Express' WHERE "name" = 'DHL Express';
UPDATE "ShippingCountry" SET "isEnabled" = true WHERE "code" IN ('BG', 'CY', 'HR', 'DK', 'GR', 'HU', 'IE', 'LV', 'MT', 'RO') AND "zoneId" IS NOT NULL;
