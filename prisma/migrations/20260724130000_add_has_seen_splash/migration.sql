-- Add hasSeenSplash column to User table
ALTER TABLE "User" ADD COLUMN "hasSeenSplash" BOOLEAN NOT NULL DEFAULT 0;
