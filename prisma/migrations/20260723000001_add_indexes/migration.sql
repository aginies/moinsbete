-- CreateIndex
CREATE INDEX "Bookmark_userId_type_idx" ON "Bookmark"("userId", "type");

-- CreateIndex
CREATE INDEX "SharedLobbyBookmark_userId_resourceType_idx" ON "SharedLobbyBookmark"("userId", "resourceType");

-- CreateIndex
CREATE INDEX "TopicSuggestion_mergedIntoId_idx" ON "TopicSuggestion"("mergedIntoId");

-- CreateIndex
CREATE INDEX "Idea_sourceId_isPublished_idx" ON "Idea"("sourceId", "isPublished");
