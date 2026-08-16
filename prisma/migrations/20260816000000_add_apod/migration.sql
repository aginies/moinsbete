-- Add apodCardVisible to User
ALTER TABLE "User" ADD COLUMN "apodCardVisible" BOOLEAN NOT NULL DEFAULT 1;

-- Create CachedApodImage table
CREATE TABLE "CachedApodImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "hdImageUrl" TEXT,
    "copyright" TEXT,
    "apodUrl" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CachedApodImage_date_key" ON "CachedApodImage"("date");

-- CreateIndex
CREATE INDEX "CachedApodImage_expiresAt_idx" ON "CachedApodImage"("expiresAt");
