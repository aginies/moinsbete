-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IDEA',
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bookmark_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bookmark" ("createdAt", "id", "ideaId", "userId") SELECT "createdAt", "id", "ideaId", "userId" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
CREATE UNIQUE INDEX "Bookmark_userId_ideaId_key" ON "Bookmark"("userId", "ideaId");
CREATE TABLE "new_Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "takeaway" TEXT NOT NULL,
    "saviezVous" TEXT,
    "slug" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Idea_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Idea" ("content", "createdAt", "id", "isPublished", "orderIndex", "saviezVous", "slug", "sourceId", "takeaway", "title", "updatedAt") SELECT "content", "createdAt", "id", "isPublished", "orderIndex", "saviezVous", "slug", "sourceId", "takeaway", "title", "updatedAt" FROM "Idea";
DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";
CREATE UNIQUE INDEX "Idea_slug_key" ON "Idea"("slug");
CREATE INDEX "Idea_slug_idx" ON "Idea"("slug");
CREATE INDEX "Idea_isPublished_idx" ON "Idea"("isPublished");
CREATE INDEX "Idea_sourceId_idx" ON "Idea"("sourceId");
CREATE INDEX "Idea_isPublished_orderIndex_idx" ON "Idea"("isPublished", "orderIndex");
CREATE INDEX "Idea_orderIndex_idx" ON "Idea"("orderIndex");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cnrsNewsEnabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("createdAt", "displayName", "email", "id", "passwordHash", "role", "updatedAt") SELECT "createdAt", "displayName", "email", "id", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
