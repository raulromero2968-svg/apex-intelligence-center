-- Create project_o_otc_orders table
CREATE TABLE IF NOT EXISTS project_o_otc_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  side TEXT NOT NULL,
  card_id TEXT NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  price_currency TEXT NOT NULL,
  size INTEGER NOT NULL,
  trader_handle TEXT,
  source TEXT NOT NULL,
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes for project_o_otc_orders
CREATE INDEX IF NOT EXISTS project_o_otc_orders_order_id_unique_idx ON project_o_otc_orders(order_id);
CREATE INDEX IF NOT EXISTS project_o_otc_orders_card_id_idx ON project_o_otc_orders(card_id);
CREATE INDEX IF NOT EXISTS project_o_otc_orders_side_card_idx ON project_o_otc_orders(side, card_id);
CREATE INDEX IF NOT EXISTS project_o_otc_orders_created_at_idx ON project_o_otc_orders(created_at);

-- Create project_o_whitelist_prices table
CREATE TABLE IF NOT EXISTS project_o_whitelist_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  price_usd NUMERIC(20, 8) NOT NULL,
  block_number INTEGER NOT NULL,
  tx_hash TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for project_o_whitelist_prices
CREATE INDEX IF NOT EXISTS project_o_whitelist_prices_token_address_idx ON project_o_whitelist_prices(token_address);
CREATE INDEX IF NOT EXISTS project_o_whitelist_prices_observed_at_idx ON project_o_whitelist_prices(observed_at);
CREATE INDEX IF NOT EXISTS project_o_whitelist_prices_chain_token_idx ON project_o_whitelist_prices(chain, token_address);

-- Create project_o_discord_messages table
CREATE TABLE IF NOT EXISTS project_o_discord_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment_score REAL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for project_o_discord_messages
CREATE INDEX IF NOT EXISTS project_o_discord_messages_message_id_unique_idx ON project_o_discord_messages(message_id);
CREATE INDEX IF NOT EXISTS project_o_discord_messages_channel_id_idx ON project_o_discord_messages(channel_id);
CREATE INDEX IF NOT EXISTS project_o_discord_messages_created_at_idx ON project_o_discord_messages(created_at);
CREATE INDEX IF NOT EXISTS project_o_discord_messages_sentiment_score_idx ON project_o_discord_messages(sentiment_score);
