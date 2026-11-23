-- Remise des packs sur la commande : colonnes ajoutées, aucune donnée existante modifiée.
ALTER TABLE "Order" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discountLabel" TEXT;
