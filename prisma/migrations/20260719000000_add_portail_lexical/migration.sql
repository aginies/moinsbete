-- Add portailLexicalCardVisible column to User table
ALTER TABLE User ADD COLUMN portailLexicalCardVisible BOOLEAN NOT NULL DEFAULT 1;
