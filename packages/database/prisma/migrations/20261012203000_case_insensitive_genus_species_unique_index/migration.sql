-- Create functional unique index on Genus (case-insensitive and trimmed)
CREATE UNIQUE INDEX IF NOT EXISTS "Genus_name_lower_idx" ON "Genus" (LOWER(TRIM("name")));

-- Create functional unique index on Species (case-insensitive and trimmed)
CREATE UNIQUE INDEX IF NOT EXISTS "Species_name_lower_idx" ON "Species" (LOWER(TRIM("name")));
