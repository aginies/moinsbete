-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "saviezVousCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "radioFranceCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikimediaCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikiLovesCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageWikiLovesShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "imageWikimediaShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "imagePixabayCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "imagePixabayShowCategories" BOOLEAN NOT NULL DEFAULT true,
    "portailLexicalCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "proverbeCardVisible" BOOLEAN NOT NULL DEFAULT true,
    "cardOrder" JSONB,
    "newsCardVisible" BOOLEAN DEFAULT true,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("cardOrder", "cnrsNewsEnabled", "createdAt", "displayName", "email", "enabled", "id", "imagePixabayCardVisible", "imagePixabayShowCategories", "imageWikiLovesCardVisible", "imageWikiLovesShowCategories", "imageWikimediaCardVisible", "imageWikimediaShowCategories", "lastLogin", "lastVisited", "newsCardVisible", "passwordHash", "portailLexicalCardVisible", "proverbeCardVisible", "radioFranceCardVisible", "role", "saviezVousCardVisible", "updatedAt", "wikipediaImageCardVisible") SELECT "cardOrder", "cnrsNewsEnabled", "createdAt", "displayName", "email", "enabled", "id", "imagePixabayCardVisible", "imagePixabayShowCategories", "imageWikiLovesCardVisible", "imageWikiLovesShowCategories", "imageWikimediaCardVisible", "imageWikimediaShowCategories", "lastLogin", "lastVisited", "newsCardVisible", "passwordHash", "portailLexicalCardVisible", "proverbeCardVisible", "radioFranceCardVisible", "role", "saviezVousCardVisible", "updatedAt", "wikipediaImageCardVisible" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
