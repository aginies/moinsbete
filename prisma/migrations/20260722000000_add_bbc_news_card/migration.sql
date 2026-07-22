-- Add bbcNewsCardVisible column to User table
ALTER TABLE "User" ADD COLUMN "bbcNewsCardVisible" BOOLEAN DEFAULT true;

-- Create CachedBbcArticle table
CREATE TABLE "CachedBbcArticle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL UNIQUE,
  "imageUrl" TEXT,
  "source" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "publishedAt" DateTime,
  "scrapedAt" DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" DateTime NOT NULL
);

-- Create indexes for CachedBbcArticle
CREATE INDEX "CachedBbcArticle_expiresAt_idx" ON "CachedBbcArticle"("expiresAt");
CREATE INDEX "CachedBbcArticle_category_idx" ON "CachedBbcArticle"("category");

-- Add BBC_NEWS to BookmarkType enum
ALTER TABLE "BookmarkType" ADD VALUE 'BBC_NEWS';
