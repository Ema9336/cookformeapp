-- AlterTable: add persisted availability and service settings to Chef
ALTER TABLE "Chef"
  ADD COLUMN "deliveryRadiusMiles" INTEGER DEFAULT 15,
  ADD COLUMN "deliveryTowns" TEXT,
  ADD COLUMN "offersInHome" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "availableDays" TEXT,
  ADD COLUMN "blockedDates" TEXT,
  ADD COLUMN "leadTimeDays" INTEGER DEFAULT 2,
  ADD COLUMN "maxBookingsPerDay" INTEGER DEFAULT 3;

-- AlterTable: add customer review fields to Booking
ALTER TABLE "Booking"
  ADD COLUMN "customerRating" INTEGER,
  ADD COLUMN "customerReview" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
