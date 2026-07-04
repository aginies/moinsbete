-- CreateIndex
CREATE INDEX "Idea_isPublished_orderIndex_idx" ON "Idea"("isPublished", "orderIndex");

-- CreateIndex
CREATE INDEX "Idea_orderIndex_idx" ON "Idea"("orderIndex");
