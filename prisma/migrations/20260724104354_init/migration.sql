-- CreateTable
CREATE TABLE "User" (
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
    "newsCardVisible" BOOLEAN DEFAULT true
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📚',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author" TEXT,
    "type" TEXT NOT NULL DEFAULT 'WIKIPEDIA',
    "url" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "SourceTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SourceTopic_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Idea" (
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

-- CreateTable
CREATE TABLE "IdeaTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ideaId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "IdeaTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaTopic_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IDEA',
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resourceId" TEXT,
    "lastReviewAt" DATETIME,
    "nextReviewAt" DATETIME,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowthPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrowthPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopicSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryName" TEXT NOT NULL,
    "parentId" TEXT,
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "userId" TEXT,
    "confidence" REAL NOT NULL,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mergedIntoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicSuggestion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TopicSuggestion_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TopicSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViewedIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewedIdea_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewedIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaviezVousFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT,
    "imageFilename" TEXT
);

-- CreateTable
CREATE TABLE "UserWikimediaTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "label" TEXT,
    "searchTerms" JSONB,
    CONSTRAINT "UserWikimediaTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CachedCnrsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedRadioEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "radio" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedWikipediaImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "archive" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CachedWikiLovesImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "commonsUrl" TEXT,
    "license" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedNewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuggestionComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SuggestionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SuggestionComment_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "UserSuggestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedLobbyBookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,
    "sharedWithUserId" TEXT,
    CONSTRAINT "SharedLobbyBookmark_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedLobbyBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UserFollowing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserFollowing_A_fkey" FOREIGN KEY ("A") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserFollowing_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CollectionToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CollectionToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollectionToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_parentId_idx" ON "Topic"("parentId");

-- CreateIndex
CREATE INDEX "Topic_slug_idx" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE INDEX "Source_type_idx" ON "Source"("type");

-- CreateIndex
CREATE INDEX "Source_slug_idx" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SourceTopic_sourceId_topicId_key" ON "SourceTopic"("sourceId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Idea_slug_key" ON "Idea"("slug");

-- CreateIndex
CREATE INDEX "Idea_slug_idx" ON "Idea"("slug");

-- CreateIndex
CREATE INDEX "Idea_isPublished_idx" ON "Idea"("isPublished");

-- CreateIndex
CREATE INDEX "Idea_sourceId_idx" ON "Idea"("sourceId");

-- CreateIndex
CREATE INDEX "Idea_sourceId_isPublished_idx" ON "Idea"("sourceId", "isPublished");

-- CreateIndex
CREATE INDEX "Idea_isPublished_orderIndex_idx" ON "Idea"("isPublished", "orderIndex");

-- CreateIndex
CREATE INDEX "Idea_orderIndex_idx" ON "Idea"("orderIndex");

-- CreateIndex
CREATE INDEX "Idea_title_idx" ON "Idea"("title");

-- CreateIndex
CREATE INDEX "IdeaTopic_topicId_idx" ON "IdeaTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaTopic_ideaId_topicId_key" ON "IdeaTopic"("ideaId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_isFeatured_idx" ON "Collection"("isFeatured");

-- CreateIndex
CREATE INDEX "Bookmark_userId_type_idx" ON "Bookmark"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_ideaId_key" ON "Bookmark"("userId", "ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_resourceId_key" ON "Bookmark"("userId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthPlan_userId_key" ON "GrowthPlan"("userId");

-- CreateIndex
CREATE INDEX "TopicSuggestion_status_idx" ON "TopicSuggestion"("status");

-- CreateIndex
CREATE INDEX "TopicSuggestion_userId_idx" ON "TopicSuggestion"("userId");

-- CreateIndex
CREATE INDEX "TopicSuggestion_mergedIntoId_idx" ON "TopicSuggestion"("mergedIntoId");

-- CreateIndex
CREATE INDEX "ViewedIdea_userId_viewedAt_idx" ON "ViewedIdea"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ViewedIdea_userId_ideaId_key" ON "ViewedIdea"("userId", "ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "SaviezVousFact_createdAt_idx" ON "SaviezVousFact"("createdAt");

-- CreateIndex
CREATE INDEX "UserWikimediaTopic_userId_idx" ON "UserWikimediaTopic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWikimediaTopic_userId_topicId_key" ON "UserWikimediaTopic"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedCnrsArticle_link_key" ON "CachedCnrsArticle"("link");

-- CreateIndex
CREATE INDEX "CachedCnrsArticle_expiresAt_idx" ON "CachedCnrsArticle"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CachedRadioEpisode_link_key" ON "CachedRadioEpisode"("link");

-- CreateIndex
CREATE INDEX "CachedRadioEpisode_expiresAt_idx" ON "CachedRadioEpisode"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedWikipediaImage_expiresAt_idx" ON "CachedWikipediaImage"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CachedWikipediaImage_imageUrl_date_key" ON "CachedWikipediaImage"("imageUrl", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CachedWikiLovesImage_docid_key" ON "CachedWikiLovesImage"("docid");

-- CreateIndex
CREATE INDEX "CachedWikiLovesImage_expiresAt_idx" ON "CachedWikiLovesImage"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedWikiLovesImage_source_year_idx" ON "CachedWikiLovesImage"("source", "year");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_CachedNewsArticle_2" ON "CachedNewsArticle"("url");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "CachedBbcArticle_category_idx" ON "CachedNewsArticle"("category");

-- CreateIndex
CREATE INDEX "CachedBbcArticle_expiresAt_idx" ON "CachedNewsArticle"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedNewsArticle_title_idx" ON "CachedNewsArticle"("title");

-- CreateIndex
CREATE INDEX "CachedNewsArticle_source_idx" ON "CachedNewsArticle"("source");

-- CreateIndex
CREATE INDEX "UserSuggestion_createdAt_idx" ON "UserSuggestion"("createdAt");

-- CreateIndex
CREATE INDEX "SuggestionComment_suggestionId_createdAt_idx" ON "SuggestionComment"("suggestionId", "createdAt");

-- CreateIndex
CREATE INDEX "SuggestionComment_userId_idx" ON "SuggestionComment"("userId");

-- CreateIndex
CREATE INDEX "SharedLobbyBookmark_userId_createdAt_idx" ON "SharedLobbyBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SharedLobbyBookmark_resourceType_idx" ON "SharedLobbyBookmark"("resourceType");

-- CreateIndex
CREATE INDEX "SharedLobbyBookmark_sharedWithUserId_createdAt_idx" ON "SharedLobbyBookmark"("sharedWithUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SharedLobbyBookmark_userId_resourceType_idx" ON "SharedLobbyBookmark"("userId", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFollowing_AB_unique" ON "_UserFollowing"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFollowing_B_index" ON "_UserFollowing"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToTopic_AB_unique" ON "_CollectionToTopic"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToTopic_B_index" ON "_CollectionToTopic"("B");
