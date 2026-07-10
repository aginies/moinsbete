-- Add SRS review tracking columns to Bookmark table
ALTER TABLE "Bookmark" ADD COLUMN "lastReviewAt" DATETIME;
ALTER TABLE "Bookmark" ADD COLUMN "nextReviewAt" DATETIME;
ALTER TABLE "Bookmark" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Bookmark" ADD COLUMN "easeFactor" REAL NOT NULL DEFAULT 2.5;
