-- CreateTable
CREATE TABLE IF NOT EXISTS "UserWikiLovesTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "label" TEXT,
    "searchTerms" JSONB,
    CONSTRAINT "UserWikiLovesTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CachedF1Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "meta" JSONB,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedWikipediaPortalArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "extract" TEXT NOT NULL,
    "imageUrl" TEXT,
    "pageUrl" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- AlterTable: add portailWikipediaCardVisible column
ALTER TABLE "User" ADD COLUMN "portailWikipediaCardVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserWikiLovesTopic_userId_idx" ON "UserWikiLovesTopic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserWikiLovesTopic_userId_topicId_key" ON "UserWikiLovesTopic"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CachedF1Article_url_key" ON "CachedF1Article"("url");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CachedF1Article_expiresAt_idx" ON "CachedF1Article"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CachedF1Article_section_idx" ON "CachedF1Article"("section");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CachedWikipediaPortalArticle_expiresAt_idx" ON "CachedWikipediaPortalArticle"("expiresAt");

