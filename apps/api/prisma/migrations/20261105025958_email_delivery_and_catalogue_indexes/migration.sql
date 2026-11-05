-- AlterTable
ALTER TABLE "EmailMessage" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryCheckedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_status_priceFromCents_idx" ON "Product"("status", "priceFromCents");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
