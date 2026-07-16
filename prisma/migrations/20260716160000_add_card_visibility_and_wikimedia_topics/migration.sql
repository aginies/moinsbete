-- Add card visibility fields to User table
ALTER TABLE "User" ADD COLUMN "wikipediaImageCardVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "saviezVousCardVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "radioFranceCardVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "imageWikimediaCardVisible" BOOLEAN NOT NULL DEFAULT true;

-- Create UserWikimediaTopic table
CREATE TABLE "UserWikimediaTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "icon" TEXT,
    "searchTerms" JSONB,
    CONSTRAINT "UserWikimediaTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index on userId and topicId
CREATE UNIQUE INDEX "UserWikimediaTopic_userId_topicId_key" ON "UserWikimediaTopic"("userId", "topicId");

-- Create index on userId
CREATE INDEX "UserWikimediaTopic_userId_idx" ON "UserWikimediaTopic"("userId");
