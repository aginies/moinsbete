-- Rename BBC_NEWS bookmark type to NEWS
UPDATE "Bookmark" SET type = 'NEWS' WHERE type = 'BBC_NEWS';
