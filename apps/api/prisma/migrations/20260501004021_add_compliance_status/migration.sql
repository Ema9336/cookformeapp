-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "city" TEXT,
    "state" TEXT,
    "lat" REAL,
    "lng" REAL,
    "category" TEXT,
    "tags" TEXT,
    "image" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "startingPrice" TEXT,
    "responseTime" TEXT,
    "licensed" BOOLEAN NOT NULL DEFAULT false,
    "distance" TEXT,
    "complianceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chef_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Chef" ("bio", "category", "city", "createdAt", "distance", "id", "image", "lat", "licensed", "lng", "rating", "responseTime", "reviews", "slug", "startingPrice", "state", "tags", "updatedAt", "userId") SELECT "bio", "category", "city", "createdAt", "distance", "id", "image", "lat", "licensed", "lng", "rating", "responseTime", "reviews", "slug", "startingPrice", "state", "tags", "updatedAt", "userId" FROM "Chef";
DROP TABLE "Chef";
ALTER TABLE "new_Chef" RENAME TO "Chef";
CREATE UNIQUE INDEX "Chef_userId_key" ON "Chef"("userId");
CREATE UNIQUE INDEX "Chef_slug_key" ON "Chef"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
