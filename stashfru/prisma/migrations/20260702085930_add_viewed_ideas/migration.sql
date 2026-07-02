-- CreateTable
CREATE TABLE "ViewedIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewedIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewedIdea_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ViewedIdea_userId_viewedAt_idx" ON "ViewedIdea"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ViewedIdea_userId_ideaId_key" ON "ViewedIdea"("userId", "ideaId");
