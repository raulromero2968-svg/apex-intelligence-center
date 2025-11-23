-- =============================================
-- APEX INTELLIGENCE - Initial Database Schema
-- Migration: 001 - Initial Setup
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'intelligence', 'apex')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- =============================================
-- USER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_alerts BOOLEAN DEFAULT true,
  price_alert_threshold DECIMAL DEFAULT 5.0,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY')),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preferences_user_id ON user_preferences(user_id);

-- =============================================
-- PORTFOLIO ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_number TEXT,
  rarity TEXT,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  condition TEXT CHECK (condition IN ('mint', 'near-mint', 'excellent', 'good', 'light-play', 'played', 'poor')),
  graded BOOLEAN DEFAULT false,
  grading_company TEXT CHECK (grading_company IN ('PSA', 'BGS', 'CGC', 'SGC')),
  grade DECIMAL,
  purchase_price DECIMAL,
  purchase_date DATE,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio indexes
CREATE INDEX idx_portfolio_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_card_id ON portfolio_items(card_id);
CREATE INDEX idx_portfolio_set_name ON portfolio_items(set_name);
CREATE INDEX idx_portfolio_graded ON portfolio_items(graded);
CREATE INDEX idx_portfolio_created_at ON portfolio_items(created_at DESC);

-- =============================================
-- PRICE ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('raw', 'psa9', 'psa10', 'bgs9', 'bgs10')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('above', 'below', 'change_percent')),
  target_price DECIMAL,
  percent_change DECIMAL,
  active BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  last_triggered_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  notification_method TEXT DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts indexes
CREATE INDEX idx_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_alerts_card_id ON price_alerts(card_id);
CREATE INDEX idx_alerts_active ON price_alerts(active);
CREATE INDEX idx_alerts_triggered ON price_alerts(triggered);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  portfolio_item_id UUID REFERENCES portfolio_items(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'trade')),
  quantity INT NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  fees DECIMAL DEFAULT 0,
  platform TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_portfolio_item ON transactions(portfolio_item_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- =============================================
-- WATCHLIST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  target_price DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX idx_watchlist_user_id ON watchlist_items(user_id);
CREATE INDEX idx_watchlist_card_id ON watchlist_items(card_id);

-- =============================================
-- USER ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_activity_type ON user_activity(activity_type);
CREATE INDEX idx_activity_created_at ON user_activity(created_at DESC);

-- =============================================
-- PRICE CACHE TABLE (for API response caching)
-- =============================================
CREATE TABLE IF NOT EXISTS price_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id TEXT UNIQUE NOT NULL,
  price_data JSONB NOT NULL,
  source TEXT NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_price_cache_card_id ON price_cache(card_id);
CREATE INDEX idx_price_cache_expires_at ON price_cache(expires_at);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON portfolio_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON price_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON watchlist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Portfolio policies
CREATE POLICY portfolio_select_own ON portfolio_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY portfolio_insert_own ON portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY portfolio_update_own ON portfolio_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY portfolio_delete_own ON portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY alerts_select_own ON price_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alerts_insert_own ON price_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY alerts_update_own ON price_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY alerts_delete_own ON price_alerts FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY transactions_select_own ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY transactions_insert_own ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY watchlist_select_own ON watchlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY watchlist_insert_own ON watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY watchlist_update_own ON watchlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY watchlist_delete_own ON watchlist_items FOR DELETE USING (auth.uid() = user_id);

-- Activity policies
CREATE POLICY activity_select_own ON user_activity FOR SELECT USING (auth.uid() = user_id);

-- Preferences policies
CREATE POLICY preferences_select_own ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY preferences_insert_own ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY preferences_update_own ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY subscriptions_select_own ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA (Optional - Remove in production)
-- =============================================

-- Create demo user (only for development)
-- INSERT INTO users (id, email, name, tier) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'demo@apex-intelligence.io', 'Demo User', 'intelligence');

-- Create demo preferences
-- INSERT INTO user_preferences (user_id) VALUES
--   ('00000000-0000-0000-0000-000000000001');
