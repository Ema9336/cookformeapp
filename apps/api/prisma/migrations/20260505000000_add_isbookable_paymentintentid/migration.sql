-- AlterTable: add isBookable to Chef
ALTER TABLE "Chef" ADD COLUMN "isBookable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add paymentIntentId to Booking
ALTER TABLE "Booking" ADD COLUMN "paymentIntentId" TEXT;

-- CreateIndex: unique constraint on paymentIntentId
CREATE UNIQUE INDEX "Booking_paymentIntentId_key" ON "Booking"("paymentIntentId");
