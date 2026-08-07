-- CreateTable
CREATE TABLE "CachedCitationArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "source" TEXT,
    "category" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL,
    "wikiUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedInsoliteArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT DEFAULT 'général',
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PortailLexicalMotDuJour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CachedWikipediaImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "archive" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);
INSERT INTO "new_CachedWikipediaImage" ("archive", "date", "description", "expiresAt", "fileUrl", "id", "imageUrl", "scrapedAt") SELECT "archive", "date", "description", "expiresAt", "fileUrl", "id", "imageUrl", "scrapedAt" FROM "CachedWikipediaImage";
DROP TABLE "CachedWikipediaImage";
ALTER TABLE "new_CachedWikipediaImage" RENAME TO "CachedWikipediaImage";
CREATE INDEX "CachedWikipediaImage_expiresAt_idx" ON "CachedWikipediaImage"("expiresAt");
CREATE INDEX "CachedWikipediaImage_language_idx" ON "CachedWikipediaImage"("language");
CREATE UNIQUE INDEX "CachedWikipediaImage_imageUrl_date_language_key" ON "CachedWikipediaImage"("imageUrl", "date", "language");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "lastVisited" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cnrsNewsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "wikipediaImageCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "wikipediaImageShowEn" BOOLEAN NOT NULL DEFAULT false,
    "saviezVousCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "radioFranceCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikimediaCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikiLovesCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikiLovesShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "imageWikimediaShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "imagePixabayCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imagePixabayShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "imagePixabayActiveCategory" TEXT NOT NULL DEFAULT 'bird',
    "portailLexicalCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "portailWikipediaCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "f1CardVisible" BOOLEAN NOT NULL DEFAULT true,
    "proverbeCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "citationCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "insoliteCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "cardOrder" JSONB,
    "newsCardVisible" BOOLEAN DEFAULT true,
    "cardNavBarEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hasSeenSplash" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("cardOrder", "cnrsNewsEnabled", "createdAt", "displayName", "email", "emailNotificationsEnabled", "enabled", "hasSeenSplash", "id", "imagePixabayActiveCategory", "imagePixabayCardVisible", "imagePixabayShowCategories", "imageWikiLovesCardVisible", "imageWikiLovesShowCategories", "imageWikimediaCardVisible", "imageWikimediaShowCategories", "lastLogin", "lastVisited", "newsCardVisible", "passwordHash", "portailLexicalCardVisible", "portailWikipediaCardVisible", "proverbeCardVisible", "radioFranceCardVisible", "role", "saviezVousCardVisible", "updatedAt", "wikipediaImageCardVisible") SELECT "cardOrder", "cnrsNewsEnabled", "createdAt", "displayName", "email", "emailNotificationsEnabled", "enabled", "hasSeenSplash", "id", coalesce("imagePixabayActiveCategory", 'bird') AS "imagePixabayActiveCategory", "imagePixabayCardVisible", "imagePixabayShowCategories", "imageWikiLovesCardVisible", "imageWikiLovesShowCategories", "imageWikimediaCardVisible", "imageWikimediaShowCategories", "lastLogin", "lastVisited", "newsCardVisible", "passwordHash", "portailLexicalCardVisible", "portailWikipediaCardVisible", "proverbeCardVisible", "radioFranceCardVisible", "role", "saviezVousCardVisible", "updatedAt", "wikipediaImageCardVisible" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CachedCitationArticle_expiresAt_idx" ON "CachedCitationArticle"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedCitationArticle_category_idx" ON "CachedCitationArticle"("category");

-- CreateIndex
CREATE INDEX "CachedCitationArticle_categoryType_idx" ON "CachedCitationArticle"("categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "CachedCitationArticle_author_text_key" ON "CachedCitationArticle"("author", "text");

-- CreateIndex
CREATE INDEX "CachedInsoliteArticle_expiresAt_idx" ON "CachedInsoliteArticle"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedInsoliteArticle_category_idx" ON "CachedInsoliteArticle"("category");

-- CreateIndex
CREATE UNIQUE INDEX "PortailLexicalMotDuJour_date_key" ON "PortailLexicalMotDuJour"("date");

-- CreateIndex
CREATE INDEX "PortailLexicalMotDuJour_date_idx" ON "PortailLexicalMotDuJour"("date");
