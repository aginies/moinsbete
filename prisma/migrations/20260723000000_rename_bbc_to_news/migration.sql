-- Rename bbcNewsCardVisible column to newsCardVisible
ALTER TABLE User RENAME COLUMN bbcNewsCardVisible TO newsCardVisible;

-- Rename BBC_NEWS bookmark type to NEWS
UPDATE "Bookmark" SET type = 'NEWS' WHERE type = 'BBC_NEWS';
