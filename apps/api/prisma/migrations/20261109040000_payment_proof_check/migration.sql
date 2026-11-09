-- Contrôle automatique du justificatif de virement (référence + montant lus dans le fichier) enregistré sur le paiement.
ALTER TABLE "Payment" ADD COLUMN "proofCheck" JSONB;
