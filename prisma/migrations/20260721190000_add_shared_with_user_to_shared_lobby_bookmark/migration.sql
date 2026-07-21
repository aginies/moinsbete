-- Add sharedWithUserId column to SharedLobbyBookmark
ALTER TABLE "SharedLobbyBookmark" ADD COLUMN "sharedWithUserId" TEXT;

-- Add index for sharedWithUserId
CREATE INDEX "SharedLobbyBookmark_sharedWithUserId_createdAt_idx" ON "SharedLobbyBookmark"("sharedWithUserId", "createdAt");
