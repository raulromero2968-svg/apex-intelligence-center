SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'watchlist_items'
  AND column_name = 'notified';

