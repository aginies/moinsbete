-- Add airCrashCardVisible to User
ALTER TABLE "User" ADD COLUMN "airCrashCardVisible" BOOLEAN NOT NULL DEFAULT 1;

-- Create CachedAirCrashArticle table
CREATE TABLE "CachedAirCrashArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CachedAirCrashArticle_title_key" ON "CachedAirCrashArticle"("title");

-- CreateIndex
CREATE INDEX "CachedAirCrashArticle_expiresAt_idx" ON "CachedAirCrashArticle"("expiresAt");
