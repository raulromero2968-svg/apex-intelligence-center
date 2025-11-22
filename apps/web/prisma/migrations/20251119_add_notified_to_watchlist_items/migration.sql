-- Add notified column to watchlist_items if it does not exist
ALTER TABLE "watchlist_items"
ADD COLUMN IF NOT EXISTS "notified" boolean NOT NULL DEFAULT false;

-- Create a partial index on card_id where notified = false
CREATE INDEX IF NOT EXISTS "watchlist_items_notified_false_card_id_idx"
ON "watchlist_items" ("card_id")
WHERE "notified" = false;

