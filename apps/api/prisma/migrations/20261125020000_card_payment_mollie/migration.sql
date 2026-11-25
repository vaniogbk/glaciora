-- Paiement par carte (Mollie) : prestataire et identifiant du paiement chez lui (tr_…), unique pour relier le webhook.
ALTER TABLE "Payment" ADD COLUMN "provider" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerPaymentId" TEXT;
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
