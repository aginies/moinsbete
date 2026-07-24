-- Add hasSeenSplash column to User table (idempotent)
BEGIN TRANSACTION;
CREATE TABLE "User_backup" AS SELECT * FROM "User" LIMIT 0;
INSERT INTO "User_backup" SELECT * FROM "User" WHERE 1=0;
ALTER TABLE "User" ADD COLUMN "hasSeenSplash" BOOLEAN NOT NULL DEFAULT 0;
DROP TABLE "User_backup";
COMMIT;
