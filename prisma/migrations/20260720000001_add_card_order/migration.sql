ALTER TABLE "User" ADD COLUMN "cardOrder" TEXT;
UPDATE "User" SET "cardOrder" = '["saviezVous","wikipedia","cnrs","radioFrance","wikimedia","wikiloves","pixabay","portailLexical","proverbe"]' WHERE "cardOrder" IS NULL;
